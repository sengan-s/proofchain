import os
import io
import pytest

from backend.app import app
from backend.hashing import calculate_bytes_sha256, calculate_sha256
from backend.database import init_db, get_db_connection

@pytest.fixture
def client():
    app.config['TESTING'] = True
    init_db()
    with app.test_client() as client:
        yield client

def test_sha256_hashing_consistency():
    content = b"PROOFCHAIN_DETERMINISTIC_TEST_PAYLOAD_2026"
    hash1 = calculate_bytes_sha256(content)
    hash2 = calculate_bytes_sha256(content)
    assert hash1 == hash2, "SHA-256 calculation must be deterministic"

    modified_content = b"PROOFCHAIN_DETERMINISTIC_TEST_PAYLOAD_2027"
    hash_modified = calculate_bytes_sha256(modified_content)
    assert hash1 != hash_modified, "Modifying even one byte must produce a completely different SHA-256 hash"

def test_evidence_registration_api(client):
    test_file = (io.BytesIO(b"Sample CCTV stream bytes data"), 'test_cctv.mp4')
    data = {
        'evidence_id': 'EVD-TEST-API-001',
        'case_id': 'CASE-API-100',
        'title': 'Test CCTV Footage',
        'description': 'Integration testing evidence file upload',
        'evidence_type': 'Video',
        'location': 'Zone B',
        'collector': 'Test Officer',
        'file': test_file
    }

    response = client.post('/api/evidence/register', data=data, content_type='multipart/form-data')
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data['evidence']['evidence_id'] == 'EVD-TEST-API-001'
    assert 'file_hash' in json_data['evidence']

def test_evidence_verification_authentic_and_tampered(client):
    original_bytes = b"ORIGINAL_CONFIDENTIAL_EVIDENCE_STREAM_V1"
    tampered_bytes = b"TAMPERED_CONFIDENTIAL_EVIDENCE_STREAM_V1"

    # Register original
    reg_file = (io.BytesIO(original_bytes), 'evidence_doc.txt')
    reg_data = {
        'evidence_id': 'EVD-TEST-VERIFY-001',
        'case_id': 'CASE-VERIFY-200',
        'title': 'Original Verification Test Document',
        'evidence_type': 'Document',
        'location': 'Lab 1',
        'collector': 'Analyst Matrix',
        'file': reg_file
    }
    client.post('/api/evidence/register', data=reg_data, content_type='multipart/form-data')

    # Test 1: Authentic Verification
    authentic_file = (io.BytesIO(original_bytes), 'evidence_doc.txt')
    auth_data = {
        'evidence_id': 'EVD-TEST-VERIFY-001',
        'file': authentic_file
    }
    auth_res = client.post('/api/evidence/verify', data=auth_data, content_type='multipart/form-data')
    assert auth_res.status_code == 200
    auth_json = auth_res.get_json()
    assert auth_json['status'] == 'AUTHENTIC'
    assert auth_json['is_match'] is True

    # Test 2: Tampered Verification
    tamper_file = (io.BytesIO(tampered_bytes), 'evidence_doc_altered.txt')
    tamper_data = {
        'evidence_id': 'EVD-TEST-VERIFY-001',
        'file': tamper_file
    }
    tamper_res = client.post('/api/evidence/verify', data=tamper_data, content_type='multipart/form-data')
    assert tamper_res.status_code == 200
    tamper_json = tamper_res.get_json()
    assert tamper_json['status'] == 'TAMPERED'
    assert tamper_json['is_match'] is False

def test_alerts_endpoint(client):
    res = client.get('/api/alerts')
    assert res.status_code == 200
    alerts = res.get_json()
    assert isinstance(alerts, list)

def test_dashboard_stats_endpoint(client):
    res = client.get('/api/dashboard/stats')
    assert res.status_code == 200
    data = res.get_json()
    assert 'total_evidence' in data
    assert 'verified_evidence' in data
    assert 'tampering_detected' in data
