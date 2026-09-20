# ProofChain – Blockchain-Based Digital Evidence Integrity System

> **Core Philosophy**: *"ProofChain creates a tamper-evident digital fingerprint of evidence on blockchain, allowing investigators to verify whether the evidence presented later is identical to the evidence originally collected."*

ProofChain is a full-stack digital evidence integrity platform designed for law enforcement, digital forensics units, and judicial auditors. It addresses the critical vulnerability where digital evidence (CCTV videos, forensic disk images, PDFs, audio recordings) can be secretly altered or swapped post-collection.

By storing **only cryptographic SHA-256 digests and metadata on an immutable Ethereum-compatible blockchain**—while storing raw files in secure local/cloud storage—ProofChain guarantees verifiable authenticity without exposing sensitive evidence content on-chain.

---

## 🏗 Architecture Overview

```text
                                  ┌────────────────────────┐
                                  │    USER / INVESTIGATOR │
                                  └───────────┬────────────┘
                                              │
                                              ▼
                                 ┌──────────────────────────┐
                                 │ CYBERSECURITY DASHBOARD  │
                                 │ (HTML5 / CSS3 / Web3 JS) │
                                 └────────────┬─────────────┘
                                              │
                                              ▼
                                 ┌──────────────────────────┐
                                 │      FLASK REST API      │
                                 │     (Python Backend)     │
                                 └──────┬────────────┬──────┘
                                        │            │
                         ┌──────────────┘            └──────────────┐
                         ▼                                          ▼
             ┌───────────────────────┐                  ┌───────────────────────┐
             │    SQLite DATABASE    │                  │    REAL SHA-256 HASH  │
             │ (Metadata & Alerts)   │                  │   (4KB Stream Chunks) │
             └───────────────────────┘                  └───────────┬───────────┘
                                                                    │
                                                                    ▼
                                                        ┌───────────────────────┐
                                                        │  Evidence Fingerprint │
                                                        └───────────┬───────────┘
                                                                    │
                                                                    ▼
                                                        ┌───────────────────────┐
                                                        │   SOLIDITY CONTRACT   │
                                                        │ (EvidenceRegistry.sol)│
                                                        └───────────┬───────────┘
                                                                    │
                                                                    ▼
                                                        ┌───────────────────────┐
                                                        │ HARDHAT LOCAL BLOCKCHAIN│
                                                        │ (Local Ethereum RPC)  │
                                                        └───────────────────────┘
```

---

## 🛠 Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Glassmorphism Dark Theme), JavaScript ES6+, Ethers.js v6, MetaMask Extension Support.
- **Backend**: Python 3.10+, Flask 3.0+, Web3.py, Werkzeug.
- **Blockchain**: Solidity 0.8.20, Hardhat 2.19+, Ethers.js / Web3.py relayer.
- **Database**: SQLite3.
- **Hashing Engine**: Native Python `hashlib.sha256()` with 4096-byte chunk updates.
- **File Storage**: Local `uploads/` folder (Designed for IPFS / S3 expansion).

---

## 🚀 Quick Start Guide

### 1. Prerequisites

- **Node.js**: v18+ and `npm`
- **Python**: v3.10+ and `pip`

### 2. Environment Setup & Dependency Installation

Clone the repository and install Node.js and Python packages:

```bash
# Install Node.js Hardhat dependencies
npm install

# Install Python backend dependencies
pip install -r requirements.txt
```

### 3. Start Local Hardhat Blockchain Node

Open Terminal #1:

```bash
npx hardhat node
```
*This starts a local Ethereum node on `http://127.0.0.1:8545` with 20 pre-funded test accounts.*

### 4. Deploy Smart Contract

Open Terminal #2:

```bash
npx hardhat run scripts/deploy.js --network localhost
```
*This deploys `EvidenceRegistry.sol` to the local network and exports contract ABI/address configuration to `backend/contract_data.json` and `frontend/js/contract_config.json`.*

### 5. Seed Initial Demo Dataset (Optional but Recommended)

Seed initial sample evidence records and chain of custody logs:

```bash
python backend/seed.py
```

### 6. Start Flask Backend Server

Run the Flask application:

```bash
python backend/app.py
```
*The server starts at `http://127.0.0.1:5000`.*

### 7. Launch Web Application

Open your browser and navigate to:
👉 **`http://127.0.0.1:5000`**

---

## 🦊 Connecting MetaMask to Local Hardhat Node

1. Open the MetaMask browser extension.
2. Click the Network dropdown -> **Add Network** -> **Add a network manually**.
3. Fill in:
   - **Network Name**: `Hardhat Localhost`
   - **New RPC URL**: `http://127.0.0.1:8545`
   - **Chain ID**: `31337`
   - **Currency Symbol**: `ETH`
4. Import Account using Private Key #0 output by `npx hardhat node`:
   - `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
5. Click **Connect Wallet** in the ProofChain dashboard sidebar.

---

## 🎬 Hackathon Demonstration Flow

Follow these steps for a live judge presentation:

### Demo 1 — Seed & Register Evidence
1. Click **Seed Demo Data** or go to **Register Evidence**.
2. Upload `test_files/CCTV_001.mp4` under Evidence ID `EVD-001` (Case `CASE-001`).
3. Notice the live SHA-256 hash calculated in real-time on selection.
4. Click **Register Evidence On-Chain**. Observe instant smart contract execution and receipt of the transaction hash (`0x...`).

### Demo 2 — Verify Authentic Original File
1. Navigate to **Verify Evidence**.
2. Enter Evidence ID `EVD-001`.
3. Upload the exact same file `test_files/CCTV_001.mp4`.
4. Click **Run Integrity Verification**.
5. Result: Glowing Green **`EVIDENCE VERIFIED AUTHENTIC ✅`** interface showing matching SHA-256 hashes.

### Demo 3 — Modify File & Detect Tampering
1. Open `test_files/CCTV_001.mp4` in a text editor, edit or add a single character, and save as `CCTV_001_TAMPERED.mp4`.
2. Go to **Verify Evidence** -> enter Evidence ID `EVD-001`.
3. Upload `CCTV_001_TAMPERED.mp4`.
4. Click **Run Integrity Verification**.
5. Result: Glowing Crimson Red **`TAMPERING DETECTED ⚠️`** alert! The system displays original hash vs received hash side-by-side and logs a security incident alert under **Tampering Alerts**.

### Demo 4 — Interactive Chain of Custody
1. Click on `EVD-001` to view its **Details Page**.
2. Scroll to **Chain of Custody Timeline** to view recorded timeline steps (`COLLECTED` ➔ `TRANSFERRED` ➔ `RECEIVED` ➔ `ANALYZED` ➔ `SUBMITTED`).
3. Use the form to append a new custody transfer event. Notice it is immediately written to both SQLite and the Solidity smart contract.

---

## 📡 REST API Documentation

| Endpoint | Method | Description |
|---|---|---|
| `POST /api/evidence/register` | `POST` | Upload file, compute SHA-256, store in SQLite & Solidity contract. |
| `POST /api/evidence/verify` | `POST` | Upload suspect file, compute SHA-256, compare with on-chain hash. |
| `GET /api/evidence` | `GET` | List evidence with search (`?search=`), type (`?type=`), status (`?status=`). |
| `GET /api/evidence/<id>` | `GET` | Retrieve complete evidence metadata, SHA-256 fingerprint, & custody logs. |
| `GET /api/evidence/<id>/custody` | `GET/POST` | Get or log Chain of Custody events on-chain. |
| `GET /api/evidence/<id>/blockchain` | `GET` | Query raw on-chain state directly from contract. |
| `GET /api/alerts` | `GET` | List detected tampering attempt logs. |
| `GET /api/dashboard/stats` | `GET` | Return summary count metrics for dashboard. |
| `POST /api/demo/seed` | `POST` | Seed sample dataset for interactive demo. |

---

## 🧪 Testing Suite

Run smart contract unit tests:

```bash
npx hardhat test
```

Run backend & SHA-256 integrity pytest suite:

```bash
pytest tests/test_backend.py
```

---

## 🔮 Future Improvements

- **IPFS / Arweave Storage**: Decentralized storage integration for evidence payload backup.
- **Zero-Knowledge Proofs (zk-SNARKs)**: Prove file authenticity without revealing file metadata.
- **Hardware Security Module (HSM)**: Cryptographic signature binding at the point of camera capture.
- **Automated Video Frame Fingerprinting**: Detecting micro-edits in video frames even if re-encoded.

---

## 📄 License

MIT License © 2026 ProofChain System.
