import hashlib
import os

def calculate_sha256(file_path: str) -> str:
    """
    Computes the SHA-256 hash of a file reading in 4096-byte chunks.
    Guarantees deterministic cryptographic hash output.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")

    sha256 = hashlib.sha256()
    with open(file_path, "rb") as file:
        while chunk := file.read(4096):
            sha256.update(chunk)

    return sha256.hexdigest()

def calculate_bytes_sha256(file_bytes: bytes) -> str:
    """
    Computes SHA-256 directly from in-memory byte buffer.
    """
    sha256 = hashlib.sha256()
    sha256.update(file_bytes)
    return sha256.hexdigest()
