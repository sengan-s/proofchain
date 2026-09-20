import sqlite3
import os
import werkzeug.security as security
from typing import Dict, Any, List, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "proofchain.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Users Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'Viewer',
            full_name TEXT NOT NULL,
            agency TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Evidence Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS evidence (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            evidence_id TEXT UNIQUE NOT NULL,
            case_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            evidence_type TEXT NOT NULL,
            filename TEXT NOT NULL,
            original_filename TEXT NOT NULL,
            file_size INTEGER NOT NULL,
            collector TEXT NOT NULL,
            location TEXT NOT NULL,
            file_hash TEXT NOT NULL,
            tx_hash TEXT,
            block_number INTEGER,
            timestamp INTEGER,
            status TEXT DEFAULT 'REGISTERED',
            uploader_wallet TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Chain of Custody Events Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS custody_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            evidence_id TEXT NOT NULL,
            action TEXT NOT NULL,
            person TEXT NOT NULL,
            role TEXT NOT NULL,
            notes TEXT,
            tx_hash TEXT,
            timestamp INTEGER,
            actor_wallet TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (evidence_id) REFERENCES evidence (evidence_id)
        )
    ''')

    # Verification Attempt Logs Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS verification_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            evidence_id TEXT NOT NULL,
            uploaded_filename TEXT NOT NULL,
            computed_hash TEXT NOT NULL,
            original_hash TEXT NOT NULL,
            status TEXT NOT NULL, -- 'AUTHENTIC' or 'TAMPERED'
            result_message TEXT NOT NULL,
            verified_by TEXT DEFAULT 'Anonymous',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Tampering Alerts Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            evidence_id TEXT NOT NULL,
            original_hash TEXT NOT NULL,
            computed_hash TEXT NOT NULL,
            attempted_by TEXT NOT NULL,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Video Verifications Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS video_verifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            verification_id TEXT UNIQUE NOT NULL,
            evidence_id TEXT NOT NULL,
            user_id TEXT NOT NULL DEFAULT 'investigator',
            video_hash TEXT NOT NULL,
            video_filename TEXT NOT NULL,
            original_video_filename TEXT NOT NULL,
            video_size INTEGER NOT NULL,
            duration REAL,
            format TEXT,
            challenge_text TEXT NOT NULL,
            challenge_response TEXT,
            challenge_result TEXT DEFAULT 'UNCHECKED',
            face_check_result TEXT DEFAULT 'USER_REPORTED',
            audio_check_result TEXT DEFAULT 'UNCHECKED',
            integrity_result TEXT DEFAULT 'UNCHECKED',
            overall_status TEXT DEFAULT 'PENDING',
            access_status TEXT DEFAULT 'Private',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP,
            FOREIGN KEY (evidence_id) REFERENCES evidence (evidence_id)
        )
    ''')

    # Video Access Audit Log
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS video_access_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            verification_id TEXT NOT NULL,
            accessor TEXT NOT NULL DEFAULT 'Anonymous',
            action TEXT NOT NULL DEFAULT 'VIEW',
            ip_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Seed Default Roles Users if empty
    cursor.execute('SELECT COUNT(*) FROM users')
    if cursor.fetchone()[0] == 0:
        default_users = [
            ('admin', security.generate_password_hash('admin123'), 'Admin', 'Chief Officer Sarah Connor', 'Cyber Forensics Unit'),
            ('investigator', security.generate_password_hash('investigator123'), 'Investigator', 'Det. John Matrix', 'Digital Evidence Bureau'),
            ('viewer', security.generate_password_hash('viewer123'), 'Viewer', 'Auditor Alex Murphy', 'Internal Audit')
        ]
        cursor.executemany('''
            INSERT INTO users (username, password_hash, role, full_name, agency)
            VALUES (?, ?, ?, ?, ?)
        ''', default_users)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
