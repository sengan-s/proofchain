import sqlite3
import os
from typing import Dict, Any, List, Optional
from backend.database import get_db_connection

def create_evidence_record(data: Dict[str, Any]) -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('''
        INSERT INTO evidence (
            evidence_id, case_id, title, description, evidence_type,
            filename, original_filename, file_size, collector, location,
            file_hash, tx_hash, block_number, timestamp, status, uploader_wallet
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['evidence_id'], data['case_id'], data['title'], data.get('description', ''),
        data['evidence_type'], data['filename'], data['original_filename'], data['file_size'],
        data['collector'], data['location'], data['file_hash'], data.get('tx_hash', ''),
        data.get('block_number', 0), data.get('timestamp', 0), data.get('status', 'REGISTERED'),
        data.get('uploader_wallet', '')
    ))

    # Add initial custody log
    cursor.execute('''
        INSERT INTO custody_events (evidence_id, action, person, role, notes, tx_hash, timestamp, actor_wallet)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        data['evidence_id'],
        "Evidence Collected & Registered",
        data['collector'],
        "Collecting Officer",
        f"Registered at location: {data['location']}",
        data.get('tx_hash', ''),
        data.get('timestamp', 0),
        data.get('uploader_wallet', '')
    ))

    conn.commit()
    conn.close()
    return get_evidence_by_id(data['evidence_id'])

def get_evidence_by_id(evidence_id: str) -> Optional[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM evidence WHERE evidence_id = ?', (evidence_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_all_evidence(
    search: str = "",
    evidence_type: str = "",
    status: str = "",
    sort_by: str = "newest"
) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()

    query = "SELECT * FROM evidence WHERE 1=1"
    params = []

    if search:
        query += " AND (evidence_id LIKE ? OR case_id LIKE ? OR filename LIKE ? OR title LIKE ?)"
        pattern = f"%{search}%"
        params.extend([pattern, pattern, pattern, pattern])

    if evidence_type:
        query += " AND evidence_type = ?"
        params.append(evidence_type)

    if status:
        query += " AND status = ?"
        params.append(status)

    if sort_by == "oldest":
        query += " ORDER BY id ASC"
    else:
        query += " ORDER BY id DESC"

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_evidence_status(evidence_id: str, status: str):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE evidence SET status = ? WHERE evidence_id = ?', (status, evidence_id))
    conn.commit()
    conn.close()

def add_custody_event(evidence_id: str, action: str, person: str, role: str, notes: str = "", tx_hash: str = "", actor_wallet: str = "", timestamp: int = 0):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO custody_events (evidence_id, action, person, role, notes, tx_hash, timestamp, actor_wallet)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (evidence_id, action, person, role, notes, tx_hash, timestamp, actor_wallet))
    conn.commit()
    conn.close()

def get_custody_history(evidence_id: str) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM custody_events WHERE evidence_id = ? ORDER BY id ASC', (evidence_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def log_verification_attempt(
    evidence_id: str,
    uploaded_filename: str,
    computed_hash: str,
    original_hash: str,
    status: str,
    result_message: str,
    verified_by: str = 'Anonymous'
):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO verification_logs (evidence_id, uploaded_filename, computed_hash, original_hash, status, result_message, verified_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (evidence_id, uploaded_filename, computed_hash, original_hash, status, result_message, verified_by))

    if status == 'TAMPERED':
        cursor.execute('''
            INSERT INTO alerts (evidence_id, original_hash, computed_hash, attempted_by, notes)
            VALUES (?, ?, ?, ?, ?)
        ''', (evidence_id, original_hash, computed_hash, verified_by, result_message))
        # Update evidence table status to TAMPERED
        cursor.execute('UPDATE evidence SET status = ? WHERE evidence_id = ?', ('TAMPERED', evidence_id))

    elif status == 'AUTHENTIC':
        cursor.execute('UPDATE evidence SET status = ? WHERE evidence_id = ?', ('VERIFIED', evidence_id))

    conn.commit()
    conn.close()

def get_alerts() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM alerts ORDER BY id DESC')
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_dashboard_stats() -> Dict[str, Any]:
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute('SELECT COUNT(*) FROM evidence')
    total_evidence = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM evidence WHERE status = 'VERIFIED'")
    verified_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM evidence WHERE status = 'TAMPERED'")
    tampered_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM evidence WHERE status = 'REGISTERED'")
    pending_count = cursor.fetchone()[0]

    cursor.execute('SELECT * FROM evidence ORDER BY id DESC LIMIT 5')
    recent_evidence = [dict(r) for r in cursor.fetchall()]

    cursor.execute('SELECT * FROM verification_logs ORDER BY id DESC LIMIT 5')
    recent_verifications = [dict(r) for r in cursor.fetchall()]

    conn.close()

    # Import here to avoid circular dependency
    try:
        from backend.video_verification import get_video_verification_stats
        video_stats = get_video_verification_stats()
    except Exception:
        video_stats = {"total": 0, "verified": 0, "pending": 0, "failed": 0, "recent": []}

    return {
        "total_evidence": total_evidence,
        "verified_evidence": verified_count,
        "tampering_detected": tampered_count,
        "pending_evidence": pending_count,
        "recent_evidence": recent_evidence,
        "recent_verifications": recent_verifications,
        "video_verifications": video_stats
    }

