"""
backend/video_verification.py
Video Verification Model & Service Layer for ProofChain.
Follows the same pattern as backend/models.py (raw sqlite3, Row factory, dict returns).
"""
import os
import string
import random
import time
from typing import Dict, Any, List, Optional
from backend.database import get_db_connection

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
VIDEO_FOLDER = os.path.join(
    os.path.dirname(os.path.dirname(__file__)), "uploads", "videos"
)
os.makedirs(VIDEO_FOLDER, exist_ok=True)

ALLOWED_VIDEO_EXTENSIONS = {'mp4', 'webm', 'mov'}
MAX_VIDEO_SIZE_MB = 100
MAX_DURATION_SECONDS = 30

VERIFICATION_CHALLENGES = [
    "Please look at the camera and say: I am verifying this proof.",
    "Please hold up one finger and say: This evidence is authentic.",
    "Please nod your head and say: ProofChain verification confirmed.",
    "Please say: My ProofChain verification is valid.",
    "Please turn slightly to the left, then right, then look at the camera.",
    "Please show your ID badge to the camera and say: Identity confirmed.",
    "Please say clearly: I certify this digital evidence is unaltered.",
]

# ---------------------------------------------------------------------------
# Helper: Generate PCV-XXXXXXXX style IDs
# ---------------------------------------------------------------------------
def generate_verification_id() -> str:
    """Generate a unique PCV-XXXXXXXX verification ID."""
    chars = string.ascii_uppercase + string.digits
    conn = get_db_connection()
    cursor = conn.cursor()
    while True:
        suffix = ''.join(random.choices(chars, k=8))
        vid = f"PCV-{suffix}"
        cursor.execute("SELECT id FROM video_verifications WHERE verification_id = ?", (vid,))
        if not cursor.fetchone():
            conn.close()
            return vid

def get_random_challenge() -> str:
    """Return a random verification challenge string."""
    return random.choice(VERIFICATION_CHALLENGES)

def allowed_video_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_VIDEO_EXTENSIONS

# ---------------------------------------------------------------------------
# Video Analysis Checks
# ---------------------------------------------------------------------------
def run_verification_checks(
    video_path: str,
    video_hash: str,
    challenge_text: str,
    challenge_response: str,
) -> Dict[str, Any]:
    """
    Runs all verification checks on the submitted video.
    Returns a dict with per-check results and overall_status.

    NOTE: Face detection and speech-to-text are NOT performed (no external CV/audio
    library dependency). These checks are clearly labeled as USER_REPORTED in the UI.
    """
    results = {
        "integrity_result": "PASS",
        "face_check_result": "USER_REPORTED",
        "audio_check_result": "UNCHECKED",
        "challenge_result": "UNCHECKED",
        "overall_status": "PENDING",
        "checks": []
    }

    # --- Check 1: File Integrity (hash was generated successfully) ---
    if video_hash and len(video_hash) == 64:
        results["integrity_result"] = "PASS"
        results["checks"].append({"name": "Video Integrity", "status": "PASS", "detail": "SHA-256 hash generated successfully"})
    else:
        results["integrity_result"] = "FAIL"
        results["checks"].append({"name": "Video Integrity", "status": "FAIL", "detail": "Hash generation failed"})

    # --- Check 2: Duplicate Detection ---
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT verification_id FROM video_verifications WHERE video_hash = ?", (video_hash,))
    duplicate = cursor.fetchone()
    conn.close()
    if duplicate:
        results["checks"].append({
            "name": "Duplicate Detection",
            "status": "WARNING",
            "detail": f"Video hash matches existing record {duplicate['verification_id']}"
        })
    else:
        results["checks"].append({"name": "Duplicate Detection", "status": "PASS", "detail": "No duplicate video detected"})

    # --- Check 3: File size validation ---
    try:
        size_mb = os.path.getsize(video_path) / (1024 * 1024)
        if size_mb <= MAX_VIDEO_SIZE_MB:
            results["checks"].append({"name": "File Size", "status": "PASS", "detail": f"{size_mb:.2f} MB (within {MAX_VIDEO_SIZE_MB} MB limit)"})
        else:
            results["checks"].append({"name": "File Size", "status": "FAIL", "detail": f"{size_mb:.2f} MB exceeds {MAX_VIDEO_SIZE_MB} MB limit"})
    except Exception:
        results["checks"].append({"name": "File Size", "status": "UNCHECKED", "detail": "Could not determine file size"})

    # --- Check 4: Audio Presence (heuristic: file size vs. duration estimate) ---
    # Without ffprobe/cv2 we mark audio as user-reported
    results["audio_check_result"] = "USER_REPORTED"
    results["checks"].append({
        "name": "Audio Verification",
        "status": "USER_REPORTED",
        "detail": "Audio verification is user self-reported (no audio processing library installed)"
    })

    # --- Check 5: Face Detection ---
    results["face_check_result"] = "USER_REPORTED"
    results["checks"].append({
        "name": "Face Detection",
        "status": "USER_REPORTED",
        "detail": "Face detection is user self-reported (no computer vision library installed)"
    })

    # --- Check 6: Challenge Response ---
    if challenge_response and challenge_response.strip():
        # Normalize both strings for comparison
        expected_keywords = _extract_keywords(challenge_text)
        actual_keywords = _extract_keywords(challenge_response)
        overlap = expected_keywords & actual_keywords
        if len(overlap) >= max(1, len(expected_keywords) // 3):
            results["challenge_result"] = "PASS"
            results["checks"].append({
                "name": "Challenge Response",
                "status": "PASS",
                "detail": f"Response matches challenge keywords ({len(overlap)}/{len(expected_keywords)} key words detected)"
            })
        else:
            results["challenge_result"] = "PARTIAL"
            results["checks"].append({
                "name": "Challenge Response",
                "status": "PARTIAL",
                "detail": "Partial keyword match — response may not fully match challenge"
            })
    else:
        results["challenge_result"] = "SKIPPED"
        results["checks"].append({
            "name": "Challenge Response",
            "status": "SKIPPED",
            "detail": "No text response provided"
        })

    # --- Overall Status ---
    critical_fails = [c for c in results["checks"] if c["status"] == "FAIL"]
    if critical_fails:
        results["overall_status"] = "FAILED"
    elif results["challenge_result"] == "PASS" and results["integrity_result"] == "PASS":
        results["overall_status"] = "VERIFIED"
    elif results["challenge_result"] in ("SKIPPED", "UNCHECKED"):
        results["overall_status"] = "PENDING"
    else:
        results["overall_status"] = "VERIFIED"

    return results


def _extract_keywords(text: str) -> set:
    """Extract meaningful lowercase words (> 3 chars) from text."""
    stopwords = {"the", "and", "this", "that", "your", "please", "then", "look", "say"}
    words = set(w.lower().strip('.,!?') for w in text.split() if len(w) > 3)
    return words - stopwords

# ---------------------------------------------------------------------------
# CRUD Operations
# ---------------------------------------------------------------------------
def create_video_verification(data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert a new video verification record and return it as a dict."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO video_verifications (
            verification_id, evidence_id, user_id, video_hash,
            video_filename, original_video_filename, video_size, duration, format,
            challenge_text, challenge_response, challenge_result,
            face_check_result, audio_check_result, integrity_result,
            overall_status, access_status, expires_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['verification_id'],
        data['evidence_id'],
        data.get('user_id', 'investigator'),
        data['video_hash'],
        data['video_filename'],
        data['original_video_filename'],
        data['video_size'],
        data.get('duration'),
        data.get('format', 'unknown'),
        data['challenge_text'],
        data.get('challenge_response', ''),
        data.get('challenge_result', 'UNCHECKED'),
        data.get('face_check_result', 'USER_REPORTED'),
        data.get('audio_check_result', 'USER_REPORTED'),
        data.get('integrity_result', 'UNCHECKED'),
        data.get('overall_status', 'PENDING'),
        data.get('access_status', 'Private'),
        data.get('expires_at'),
    ))
    conn.commit()
    conn.close()
    return get_video_verification(data['verification_id'])


def get_video_verification(verification_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM video_verifications WHERE verification_id = ?', (verification_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None


def get_verifications_for_evidence(evidence_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM video_verifications WHERE evidence_id = ? ORDER BY id DESC',
        (evidence_id,)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_all_video_verifications(limit: int = 50, offset: int = 0) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'SELECT * FROM video_verifications ORDER BY id DESC LIMIT ? OFFSET ?',
        (limit, offset)
    )
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def delete_video_verification(verification_id: str) -> bool:
    """Soft-delete: mark as EXPIRED and access_status=Deleted."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE video_verifications SET overall_status='EXPIRED', access_status='Deleted' WHERE verification_id = ?",
        (verification_id,)
    )
    affected = cursor.rowcount
    conn.commit()
    conn.close()
    return affected > 0


def get_video_verification_stats() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM video_verifications")
    total = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM video_verifications WHERE overall_status = 'VERIFIED'")
    verified = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM video_verifications WHERE overall_status = 'PENDING'")
    pending = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM video_verifications WHERE overall_status = 'FAILED'")
    failed = cursor.fetchone()[0]
    cursor.execute("SELECT * FROM video_verifications ORDER BY id DESC LIMIT 5")
    recent = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {
        "total": total,
        "verified": verified,
        "pending": pending,
        "failed": failed,
        "recent": recent
    }


def log_video_access(verification_id: str, accessor: str = 'Anonymous',
                     action: str = 'VIEW', ip_address: str = '') -> None:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        'INSERT INTO video_access_log (verification_id, accessor, action, ip_address) VALUES (?, ?, ?, ?)',
        (verification_id, accessor, action, ip_address)
    )
    conn.commit()
    conn.close()
