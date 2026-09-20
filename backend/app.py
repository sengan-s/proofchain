import os
import time
import werkzeug.utils
from flask import Flask, request, jsonify, send_from_directory, session, abort
from flask_cors import CORS

from backend.database import init_db, get_db_connection
from backend.hashing import calculate_sha256, calculate_bytes_sha256
from backend.blockchain import blockchain_service
from backend.auth import authenticate_user, login_required, role_required
import backend.models as models
import backend.video_verification as vv_models

app = Flask(__name__, 
            static_folder='../frontend-react/dist',
            static_url_path='')
app.secret_key = os.getenv("FLASK_SECRET_KEY", "proofchain_secure_dev_secret_key_2026")
CORS(app, supports_credentials=True)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
ALLOWED_EXTENSIONS = {'mp4', 'avi', 'mov', 'jpg', 'png', 'jpeg', 'pdf', 'docx', 'txt', 'wav', 'mp3'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50 MB Max upload limit

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
init_db()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Serve Frontend SPA
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# --- AUTH ENDPOINTS ---
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')

    user = authenticate_user(username, password)
    if user:
        session['user'] = user
        return jsonify({"message": "Login successful", "user": user}), 200
    return jsonify({"error": "Invalid username or password"}), 401

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({"message": "Logged out successfully"}), 200

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    user = session.get('user')
    if user:
        return jsonify({"user": user}), 200
    # Fallback default viewer for unauthenticated prototype browsing
    return jsonify({
        "user": {
            "id": 0,
            "username": "investigator",
            "role": "Investigator",
            "full_name": "Det. John Matrix",
            "agency": "Digital Evidence Bureau"
        }
    }), 200

# --- DASHBOARD METRICS ---
@app.route('/api/dashboard/stats', methods=['GET'])
def dashboard_stats():
    stats = models.get_dashboard_stats()
    blockchain_status = blockchain_service.get_status()
    stats["blockchain"] = blockchain_status
    return jsonify(stats), 200

# --- EVIDENCE REGISTRATION ---
@app.route('/api/evidence/register', methods=['POST'])
def register_evidence():
    """
    1. Receive uploaded evidence file and metadata
    2. Save file locally in uploads/
    3. Generate REAL SHA-256 hash
    4. Store metadata in SQLite database
    5. Send Evidence ID & SHA-256 hash to Hardhat smart contract
    6. Return confirmation with transaction hash & block timestamp
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file part in request"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": f"File type not allowed. Supported: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    evidence_id = request.form.get('evidence_id', '').strip()
    case_id = request.form.get('case_id', '').strip()
    title = request.form.get('title', '').strip()
    description = request.form.get('description', '').strip()
    evidence_type = request.form.get('evidence_type', 'Document').strip()
    location = request.form.get('location', '').strip()
    collector = request.form.get('collector', '').strip()
    client_wallet = request.form.get('wallet_address', '').strip()

    if not evidence_id or not case_id or not title:
        return jsonify({"error": "Evidence ID, Case ID, and Title are required fields"}), 400

    if models.get_evidence_by_id(evidence_id):
        return jsonify({"error": f"Evidence ID '{evidence_id}' already exists in registry"}), 409

    # Secure filename and save
    safe_filename = werkzeug.utils.secure_filename(file.filename)
    timestamp_prefix = int(time.time())
    stored_filename = f"{timestamp_prefix}_{safe_filename}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], stored_filename)
    file.save(file_path)

    # Real SHA-256 calculation
    file_hash = calculate_sha256(file_path)
    file_size = os.path.getsize(file_path)

    # Register on Blockchain via Web3.py
    metadata_uri = f"/api/evidence/{evidence_id}"
    bc_result = blockchain_service.register_evidence(evidence_id, file_hash, metadata_uri)

    # Store record in SQLite
    record_data = {
        "evidence_id": evidence_id,
        "case_id": case_id,
        "title": title,
        "description": description,
        "evidence_type": evidence_type,
        "filename": stored_filename,
        "original_filename": safe_filename,
        "file_size": file_size,
        "collector": collector or "Investigator",
        "location": location or "Field Operations",
        "file_hash": file_hash,
        "tx_hash": bc_result.get("tx_hash", ""),
        "block_number": bc_result.get("block_number", 0),
        "timestamp": bc_result.get("timestamp", int(time.time())),
        "status": "REGISTERED",
        "uploader_wallet": client_wallet or bc_result.get("uploader", "")
    }

    created_record = models.create_evidence_record(record_data)

    return jsonify({
        "message": "Evidence successfully registered on ProofChain",
        "evidence": created_record,
        "blockchain": bc_result
    }), 201

# --- EVIDENCE VERIFICATION ---
@app.route('/api/evidence/verify', methods=['POST'])
def verify_evidence():
    """
    Verification System:
    1. Upload suspect evidence file & specify Evidence ID
    2. Calculate candidate file SHA-256
    3. Retrieve original registered hash from Blockchain / SQLite
    4. Compare hashes -> MATCH (AUTHENTIC) vs MISMATCH (TAMPERED)
    5. Log verification event & alert if tampered
    """
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded for verification"}), 400

    evidence_id = request.form.get('evidence_id', '').strip()
    if not evidence_id:
        return jsonify({"error": "Evidence ID is required for verification"}), 400

    # Retrieve original evidence record
    db_record = models.get_evidence_by_id(evidence_id)
    bc_record = blockchain_service.get_evidence(evidence_id)

    if not db_record and not bc_record:
        return jsonify({"error": f"Evidence record '{evidence_id}' not found on blockchain or database"}), 404

    original_hash = bc_record["file_hash"] if bc_record else db_record["file_hash"]

    # Calculate suspect file hash directly from uploaded byte content
    file = request.files['file']
    file_bytes = file.read()
    computed_hash = calculate_bytes_sha256(file_bytes)

    # Compare hashes case-insensitively
    is_match = (computed_hash.lower() == original_hash.lower())
    status = "AUTHENTIC" if is_match else "TAMPERED"

    user_info = session.get('user', {}).get('full_name', 'Investigator')

    result_message = "SHA-256 digests match exactly. Evidence integrity verified authentic." if is_match else \
        f"HASH MISMATCH DETECTED! Expected {original_hash[:12]}... but received {computed_hash[:12]}..."

    # Log verification attempt & record alert if tampered
    models.log_verification_attempt(
        evidence_id=evidence_id,
        uploaded_filename=file.filename,
        computed_hash=computed_hash,
        original_hash=original_hash,
        status=status,
        result_message=result_message,
        verified_by=user_info
    )

    return jsonify({
        "evidence_id": evidence_id,
        "status": status,
        "is_match": is_match,
        "original_hash": original_hash,
        "current_hash": computed_hash,
        "result_message": result_message,
        "verified_at": int(time.time()),
        "verified_by": user_info
    }), 200

# --- SEARCH & LIST EVIDENCE ---
@app.route('/api/evidence', methods=['GET'])
def list_evidence():
    search = request.args.get('search', '').strip()
    evidence_type = request.args.get('type', '').strip()
    status = request.args.get('status', '').strip()
    sort_by = request.args.get('sort', 'newest').strip()

    records = models.get_all_evidence(search=search, evidence_type=evidence_type, status=status, sort_by=sort_by)
    return jsonify(records), 200

# --- EVIDENCE DETAILS ---
@app.route('/api/evidence/<evidence_id>', methods=['GET'])
def get_evidence_detail(evidence_id):
    db_record = models.get_evidence_by_id(evidence_id)
    if not db_record:
        return jsonify({"error": "Evidence record not found"}), 404

    bc_record = blockchain_service.get_evidence(evidence_id)
    custody = models.get_custody_history(evidence_id)

    return jsonify({
        "evidence": db_record,
        "blockchain": bc_record,
        "custody": custody
    }), 200

# --- CHAIN OF CUSTODY ---
@app.route('/api/evidence/<evidence_id>/custody', methods=['GET', 'POST'])
def evidence_custody(evidence_id):
    if request.method == 'GET':
        history = models.get_custody_history(evidence_id)
        return jsonify(history), 200

    elif request.method == 'POST':
        data = request.get_json() or {}
        action = data.get('action', '').strip()
        person = data.get('person', '').strip()
        role = data.get('role', 'Investigator').strip()
        notes = data.get('notes', '').strip()

        if not action or not person:
            return jsonify({"error": "Action and Person name are required"}), 400

        # Log on Blockchain
        bc_res = blockchain_service.add_custody_event(evidence_id, action, role)

        models.add_custody_event(
            evidence_id=evidence_id,
            action=action,
            person=person,
            role=role,
            notes=notes,
            tx_hash=bc_res.get("tx_hash", ""),
            actor_wallet=bc_res.get("actor", ""),
            timestamp=bc_res.get("timestamp", int(time.time()))
        )

        return jsonify({
            "message": "Custody event added successfully",
            "blockchain": bc_res
        }), 201

# --- BLOCKCHAIN RECORD QUERY ---
@app.route('/api/evidence/<evidence_id>/blockchain', methods=['GET'])
def get_blockchain_record(evidence_id):
    bc_record = blockchain_service.get_evidence(evidence_id)
    bc_custody = blockchain_service.get_custody_history(evidence_id)
    status_info = blockchain_service.get_status()

    return jsonify({
        "evidence_id": evidence_id,
        "blockchain_status": status_info,
        "on_chain_evidence": bc_record,
        "on_chain_custody": bc_custody
    }), 200

# --- TAMPERING ALERTS ---
@app.route('/api/alerts', methods=['GET'])
def get_alerts():
    alerts = models.get_alerts()
    return jsonify(alerts), 200

# --- SEED / DEMO PREPARATION ENDPOINT ---
@app.route('/api/demo/seed', methods=['POST'])
def seed_demo_data():
    """
    Pre-populates demonstration data for hackathon presenting:
    - CASE-001 / EVD-001 (CCTV video sample)
    - CASE-002 / EVD-002 (Forensic PDF sample with logged tampering attempt)
    """
    import backend.seed as seed_script
    seed_script.run_seed()
    return jsonify({"message": "Demo sample evidence and tampering alert seeded successfully!"}), 200

# =============================================================================
# VIDEO VERIFICATION ENDPOINTS
# =============================================================================

VIDEO_FOLDER = vv_models.VIDEO_FOLDER
ALLOWED_VIDEO_EXTENSIONS = vv_models.ALLOWED_VIDEO_EXTENSIONS


@app.route('/api/video-verification/challenges', methods=['GET'])
def get_challenges():
    """Return list of verification challenges for the frontend to display randomly."""
    return jsonify({"challenges": vv_models.VERIFICATION_CHALLENGES}), 200


@app.route('/api/video-verification/upload', methods=['POST'])
def upload_video_verification():
    """
    Main endpoint: Upload verification video + run analysis.
    1. Validate file & evidence ID
    2. Save video to uploads/videos/
    3. Compute SHA-256 hash
    4. Run verification checks
    5. Store record in DB
    6. Return structured result
    """
    if 'video' not in request.files:
        return jsonify({"error": "No video file in request. Use field name 'video'."}), 400

    video_file = request.files['video']
    if not video_file.filename:
        return jsonify({"error": "No video file selected."}), 400

    if not vv_models.allowed_video_file(video_file.filename):
        return jsonify({"error": f"Unsupported video format. Allowed: {', '.join(ALLOWED_VIDEO_EXTENSIONS).upper()}"}), 400

    evidence_id = request.form.get('evidence_id', '').strip()
    if not evidence_id:
        return jsonify({"error": "Evidence ID is required to link the video verification."}), 400

    # Verify the evidence record exists
    evidence_record = models.get_evidence_by_id(evidence_id)
    if not evidence_record:
        return jsonify({"error": f"Evidence record '{evidence_id}' not found. Register the evidence first."}), 404

    challenge_text = request.form.get('challenge_text', '').strip()
    challenge_response = request.form.get('challenge_response', '').strip()
    user_info = session.get('user', {})
    user_id = user_info.get('username', 'investigator')

    # Save video securely
    safe_filename = werkzeug.utils.secure_filename(video_file.filename)
    ts_prefix = int(time.time())
    stored_filename = f"{ts_prefix}_{safe_filename}"
    video_path = os.path.join(VIDEO_FOLDER, stored_filename)

    # Check file size before saving (peek at stream length)
    video_file.seek(0, 2)
    file_size = video_file.tell()
    video_file.seek(0)
    max_bytes = vv_models.MAX_VIDEO_SIZE_MB * 1024 * 1024
    if file_size > max_bytes:
        return jsonify({"error": f"Video file exceeds {vv_models.MAX_VIDEO_SIZE_MB} MB limit."}), 413

    video_file.save(video_path)

    # Compute SHA-256 hash
    try:
        video_hash = calculate_sha256(video_path)
    except Exception as e:
        os.remove(video_path)
        return jsonify({"error": f"Failed to compute video hash: {str(e)}"}), 500

    # Determine format
    video_format = safe_filename.rsplit('.', 1)[-1].lower() if '.' in safe_filename else 'unknown'

    # Run verification analysis
    check_results = vv_models.run_verification_checks(
        video_path=video_path,
        video_hash=video_hash,
        challenge_text=challenge_text,
        challenge_response=challenge_response,
    )

    # Generate unique verification ID
    verification_id = vv_models.generate_verification_id()

    # Store in database
    record_data = {
        "verification_id": verification_id,
        "evidence_id": evidence_id,
        "user_id": user_id,
        "video_hash": video_hash,
        "video_filename": stored_filename,
        "original_video_filename": safe_filename,
        "video_size": file_size,
        "format": video_format,
        "challenge_text": challenge_text,
        "challenge_response": challenge_response,
        "challenge_result": check_results["challenge_result"],
        "face_check_result": check_results["face_check_result"],
        "audio_check_result": check_results["audio_check_result"],
        "integrity_result": check_results["integrity_result"],
        "overall_status": check_results["overall_status"],
        "access_status": "Private",
    }

    created = vv_models.create_video_verification(record_data)

    # Log access
    vv_models.log_video_access(
        verification_id=verification_id,
        accessor=user_id,
        action='CREATE',
        ip_address=request.remote_addr or ''
    )

    return jsonify({
        "message": "Video verification completed successfully.",
        "verification": created,
        "checks": check_results["checks"],
        "evidence": {
            "evidence_id": evidence_record["evidence_id"],
            "title": evidence_record["title"],
            "status": evidence_record["status"],
            "file_hash": evidence_record["file_hash"],
        }
    }), 201


@app.route('/api/video-verification/stats', methods=['GET'])
def video_verification_stats():
    stats = vv_models.get_video_verification_stats()
    return jsonify(stats), 200


@app.route('/api/video-verification/history', methods=['GET'])
def video_verification_history():
    limit = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    records = vv_models.get_all_video_verifications(limit=limit, offset=offset)
    return jsonify(records), 200


@app.route('/api/video-verification/<verification_id>', methods=['GET'])
def get_video_verification(verification_id):
    record = vv_models.get_video_verification(verification_id)
    if not record:
        return jsonify({"error": f"Video verification '{verification_id}' not found."}), 404

    user_info = session.get('user', {})
    user_id = user_info.get('username', 'anonymous')
    vv_models.log_video_access(verification_id, user_id, 'VIEW', request.remote_addr or '')

    # Return metadata only — never return the raw video path
    safe_record = {k: v for k, v in record.items() if k != 'video_filename'}
    return jsonify(safe_record), 200


@app.route('/api/evidence/<evidence_id>/video-verifications', methods=['GET'])
def evidence_video_verifications(evidence_id):
    records = vv_models.get_verifications_for_evidence(evidence_id)
    # Strip internal filenames
    safe_records = [{k: v for k, v in r.items() if k != 'video_filename'} for r in records]
    return jsonify(safe_records), 200


@app.route('/api/video-verification/<verification_id>/download', methods=['GET'])
def download_video(verification_id):
    """Secure video download — requires authenticated session."""
    user = session.get('user')
    if not user:
        return jsonify({"error": "Authentication required to access verification videos."}), 401

    record = vv_models.get_video_verification(verification_id)
    if not record:
        return jsonify({"error": "Video verification record not found."}), 404

    if record.get('access_status') == 'Deleted':
        return jsonify({"error": "This video has been deleted."}), 410

    vv_models.log_video_access(
        verification_id=verification_id,
        accessor=user.get('username', 'unknown'),
        action='DOWNLOAD',
        ip_address=request.remote_addr or ''
    )

    return send_from_directory(VIDEO_FOLDER, record['video_filename'], as_attachment=True)


@app.route('/api/video-verification/<verification_id>', methods=['DELETE'])
def delete_video_verification(verification_id):
    record = vv_models.get_video_verification(verification_id)
    if not record:
        return jsonify({"error": "Video verification record not found."}), 404

    success = vv_models.delete_video_verification(verification_id)
    if success:
        return jsonify({"message": f"Video verification '{verification_id}' marked as expired/deleted."}), 200
    return jsonify({"error": "Failed to delete record."}), 500


if __name__ == '__main__':
    port = int(os.getenv("FLASK_PORT", 5000))
    print(f"Starting ProofChain Flask Server on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
