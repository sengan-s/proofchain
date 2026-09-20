import os
import json
from web3 import Web3
from typing import Dict, Any, Optional, Tuple, List

DEFAULT_RPC_URL = os.getenv("BLOCKCHAIN_RPC_URL", "http://127.0.0.1:8545")
CONTRACT_DATA_PATH = os.path.join(os.path.dirname(__file__), "contract_data.json")

class BlockchainService:
    def __init__(self):
        self.w3 = Web3(Web3.HTTPProvider(DEFAULT_RPC_URL))
        self.contract_address = None
        self.abi = None
        self.contract = None
        self._load_contract_config()

    def _load_contract_config(self):
        if os.path.exists(CONTRACT_DATA_PATH):
            try:
                with open(CONTRACT_DATA_PATH, "r") as f:
                    data = json.load(f)
                    self.contract_address = Web3.to_checksum_address(data["address"])
                    self.abi = data["abi"]
                    if self.w3.is_connected():
                        self.contract = self.w3.eth.contract(address=self.contract_address, abi=self.abi)
            except Exception as e:
                print(f"[BlockchainService] Warning loading contract_data.json: {e}")

    def is_connected(self) -> bool:
        return self.w3.is_connected()

    def get_status(self) -> Dict[str, Any]:
        connected = self.w3.is_connected()
        block_number = self.w3.eth.block_number if connected else 0
        return {
            "connected": connected,
            "rpc_url": DEFAULT_RPC_URL,
            "contract_address": self.contract_address,
            "block_number": block_number,
            "chain_id": self.w3.eth.chain_id if connected else None
        }

    def register_evidence(self, evidence_id: str, file_hash: str, metadata_uri: str = "") -> Dict[str, Any]:
        """
        Registers evidence on-chain via Web3.py.
        Uses Hardhat account 0 (unlocked / standard dev key).
        """
        self._load_contract_config()
        if not self.is_connected() or not self.contract:
            return {
                "success": False,
                "tx_hash": f"0xlocal_mock_{evidence_id}_fallback",
                "block_number": 0,
                "timestamp": int(os.path.getmtime(__file__)),
                "uploader": "0x0000000000000000000000000000000000000000",
                "note": "Hardhat node or contract not available - saved locally"
            }

        try:
            accounts = self.w3.eth.accounts
            sender = accounts[0] if accounts else "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
            
            tx = self.contract.functions.registerEvidence(
                evidence_id,
                file_hash,
                metadata_uri
            ).build_transaction({
                'from': sender,
                'nonce': self.w3.eth.get_transaction_count(sender),
                'gas': 3000000,
                'gasPrice': self.w3.eth.gas_price
            })

            # Check if dev private key exists, otherwise send transaction directly (unlocked node)
            priv_key = os.getenv("ADMIN_PRIVATE_KEY")
            if priv_key and priv_key.startswith("0x"):
                signed_tx = self.w3.eth.account.sign_transaction(tx, private_key=priv_key)
                tx_hash_bytes = self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)
            else:
                # Direct send for Hardhat node with unlocked accounts
                tx_hash_bytes = self.w3.eth.send_transaction({
                    'from': sender,
                    'to': self.contract_address,
                    'data': self.contract.encodeABI(fn_name="registerEvidence", args=[evidence_id, file_hash, metadata_uri]),
                    'gas': 3000000
                })

            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash_bytes)
            block = self.w3.eth.get_block(receipt.blockNumber)

            return {
                "success": True,
                "tx_hash": receipt.transactionHash.hex(),
                "block_number": receipt.blockNumber,
                "timestamp": block.timestamp,
                "uploader": sender
            }
        except Exception as e:
            print(f"[BlockchainService] Transaction Error: {e}")
            return {
                "success": False,
                "tx_hash": f"0xmock_tx_{evidence_id[:8]}",
                "block_number": self.w3.eth.block_number if self.is_connected() else 100,
                "timestamp": int(os.path.getmtime(__file__)),
                "uploader": self.w3.eth.accounts[0] if (self.is_connected() and self.w3.eth.accounts) else "0x0000000000000000000000000000000000000000",
                "error": str(e)
            }

    def get_evidence(self, evidence_id: str) -> Optional[Dict[str, Any]]:
        self._load_contract_config()
        if not self.is_connected() or not self.contract:
            return None

        try:
            res = self.contract.functions.getEvidence(evidence_id).call()
            return {
                "evidence_id": res[0],
                "file_hash": res[1],
                "timestamp": res[2],
                "uploader": res[3],
                "metadata_uri": res[4],
                "exists": res[5]
            }
        except Exception as e:
            print(f"[BlockchainService] Get Evidence Error for {evidence_id}: {e}")
            return None

    def add_custody_event(self, evidence_id: str, action: str, person_role: str) -> Dict[str, Any]:
        self._load_contract_config()
        if not self.is_connected() or not self.contract:
            return {"success": False, "tx_hash": f"0xlocal_custody_{evidence_id}"}

        try:
            accounts = self.w3.eth.accounts
            sender = accounts[0]
            tx_hash_bytes = self.w3.eth.send_transaction({
                'from': sender,
                'to': self.contract_address,
                'data': self.contract.encodeABI(fn_name="addCustodyEvent", args=[evidence_id, action, person_role]),
                'gas': 1000000
            })
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash_bytes)
            block = self.w3.eth.get_block(receipt.blockNumber)
            return {
                "success": True,
                "tx_hash": receipt.transactionHash.hex(),
                "block_number": receipt.blockNumber,
                "timestamp": block.timestamp,
                "actor": sender
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def get_custody_history(self, evidence_id: str) -> List[Dict[str, Any]]:
        self._load_contract_config()
        if not self.is_connected() or not self.contract:
            return []

        try:
            raw_events = self.contract.functions.getCustodyHistory(evidence_id).call()
            events = []
            for item in raw_events:
                events.append({
                    "evidence_id": item[0],
                    "action": item[1],
                    "person_role": item[2],
                    "timestamp": item[3],
                    "actor": item[4]
                })
            return events
        except Exception as e:
            print(f"[BlockchainService] Get Custody Error: {e}")
            return []

blockchain_service = BlockchainService()
