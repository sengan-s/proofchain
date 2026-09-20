import os
import shutil
import time
from backend.database import init_db, get_db_connection
from backend.hashing import calculate_sha256
from backend.blockchain import blockchain_service

def run_seed():
    init_db()
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
    test_files_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "test_files")
    os.makedirs(upload_dir, exist_ok=True)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Clear existing evidence & custody for clean demo state
    cursor.execute("DELETE FROM evidence")
    cursor.execute("DELETE FROM custody_events")
    cursor.execute("DELETE FROM verification_logs")
    cursor.execute("DELETE FROM alerts")

    # Sample 1: EVD-001 (CCTV_001.mp4) - AUTHENTIC DEMO RECORD
    cctv_src = os.path.join(test_files_dir, "CCTV_001.mp4")
    cctv_dst_name = "demo_CCTV_001.mp4"
    cctv_dst = os.path.join(upload_dir, cctv_dst_name)
    shutil.copy(cctv_src, cctv_dst)

    cctv_hash = calculate_sha256(cctv_dst)
    cctv_size = os.path.getsize(cctv_dst)
    cctv_time = int(time.time()) - 86400  # 1 day ago

    # Register on-chain
    bc_1 = blockchain_service.register_evidence("EVD-001", cctv_hash, "/api/evidence/EVD-001")

    cursor.execute('''
        INSERT INTO evidence (
            evidence_id, case_id, title, description, evidence_type,
            filename, original_filename, file_size, collector, location,
            file_hash, tx_hash, block_number, timestamp, status, uploader_wallet
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        "EVD-001", "CASE-001", "Main Entrance CCTV Video Footage",
        "High-definition security camera feed capturing entry point at 14:30 UTC.",
        "Video", cctv_dst_name, "CCTV_001.mp4", cctv_size,
        "Officer Alex Vance", "Building A - Sector 7",
        cctv_hash, bc_1.get("tx_hash", "0x72ab91c84029f1205ab3818de92131fa01928374"),
        bc_1.get("block_number", 101), cctv_time, "VERIFIED",
        bc_1.get("uploader", "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    ))

    # Chain of Custody for EVD-001
    custody_events = [
        ("EVD-001", "Evidence Collected", "Officer Alex Vance", "Field Agent", "Secured footage from DVR disk", cctv_time - 3600),
        ("EVD-001", "Evidence Transferred", "Officer Blake Griffin", "Transport Logistics", "Hand-delivered encrypted drive to Evidence Vault", cctv_time - 1800),
        ("EVD-001", "Evidence Received", "Custodian Sarah Jenkins", "Vault Custodian", "Checked tamper-evident bag seal intact", cctv_time - 900),
        ("EVD-001", "Evidence Analyzed", "Forensic Analyst Dr. Aris", "Digital Forensics Lab", "Extracted video frame sequences for metadata scan", cctv_time - 300),
        ("EVD-001", "Evidence Verified On-Chain", "Det. John Matrix", "Lead Investigator", "SHA-256 hash verified against Ethereum contract", cctv_time)
    ]

    for ev_id, act, pers, role, notes, ts in custody_events:
        cursor.execute('''
            INSERT INTO custody_events (evidence_id, action, person, role, notes, tx_hash, timestamp, actor_wallet)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (ev_id, act, pers, role, notes, "0x" + cctv_hash[:40], ts, "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"))
        # Add to smart contract custody as well
        blockchain_service.add_custody_event(ev_id, act, role)

    # Initial verification log for EVD-001
    cursor.execute('''
        INSERT INTO verification_logs (evidence_id, uploaded_filename, computed_hash, original_hash, status, result_message, verified_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        "EVD-001", "CCTV_001.mp4", cctv_hash, cctv_hash, "AUTHENTIC",
        "SHA-256 digests match exactly. Evidence integrity verified authentic.", "Det. John Matrix"
    ))


    # Sample 2: EVD-002 (Forensic_Report.pdf) - TAMPERING ALERT DEMO RECORD
    pdf_src = os.path.join(test_files_dir, "Forensic_Report.pdf")
    pdf_dst_name = "demo_Forensic_Report.pdf"
    pdf_dst = os.path.join(upload_dir, pdf_dst_name)
    shutil.copy(pdf_src, pdf_dst)

    pdf_hash = calculate_sha256(pdf_dst)
    pdf_size = os.path.getsize(pdf_dst)
    pdf_time = int(time.time()) - 43200  # 12 hours ago

    bc_2 = blockchain_service.register_evidence("EVD-002", pdf_hash, "/api/evidence/EVD-002")

    cursor.execute('''
        INSERT INTO evidence (
            evidence_id, case_id, title, description, evidence_type,
            filename, original_filename, file_size, collector, location,
            file_hash, tx_hash, block_number, timestamp, status, uploader_wallet
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        "EVD-002", "CASE-002", "Cyber Crime Incident Analysis Report",
        "Audit trail report documenting server intrusion vector.",
        "Document", pdf_dst_name, "Forensic_Report.pdf", pdf_size,
        "Det. John Matrix", "Central Cyber Lab",
        pdf_hash, bc_2.get("tx_hash", "0x89be12a4918237fa9e1029418293b48271630129"),
        bc_2.get("block_number", 102), pdf_time, "TAMPERED",
        bc_2.get("uploader", "0x70997970C51812dc3A010C7d01b50e0d17dc79C8")
    ))

    tampered_hash_simulation = "71bc82f190e38142a78129d91823bc821094821a73819273918273618239712a"

    cursor.execute('''
        INSERT INTO verification_logs (evidence_id, uploaded_filename, computed_hash, original_hash, status, result_message, verified_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        "EVD-002", "Forensic_Report_Modified.pdf", tampered_hash_simulation, pdf_hash, "TAMPERED",
        f"HASH MISMATCH DETECTED! Expected {pdf_hash[:12]}... but received {tampered_hash_simulation[:12]}...",
        "Auditor Alex Murphy"
    ))

    cursor.execute('''
        INSERT INTO alerts (evidence_id, original_hash, computed_hash, attempted_by, notes)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        "EVD-002", pdf_hash, tampered_hash_simulation, "Auditor Alex Murphy",
        "Tampered document uploaded for verification. Blockchain immutable record preserved."
    ))

    conn.commit()
    conn.close()
    print("[Seed] Seed data successfully populated into database and blockchain.")

if __name__ == "__main__":
    run_seed()
