/**
 * ProofChain Web3 MetaMask Integration Module
 */
class ProofChainWeb3 {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contractAddress = null;
        this.contractAbi = null;
        this.contract = null;
        this.userAccount = null;
        this.init();
    }

    async init() {
        // Load contract configuration generated during hardhat deployment
        try {
            const response = await fetch('/js/contract_config.json');
            if (response.ok) {
                const config = await response.json();
                this.contractAddress = config.address;
                this.contractAbi = config.abi;
            }
        } catch (e) {
            console.log("[ProofChainWeb3] Contract config file not yet generated. Using REST backend relayer fallback.");
        }
    }

    async connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            alert("MetaMask extension not detected. The prototype will use the automated Web3 backend relayer.");
            return null;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.userAccount = accounts[0];

            if (typeof window.ethers !== 'undefined') {
                this.provider = new window.ethers.BrowserProvider(window.ethereum);
                this.signer = await this.provider.getSigner();

                if (this.contractAddress && this.contractAbi) {
                    this.contract = new window.ethers.Contract(
                        this.contractAddress,
                        this.contractAbi,
                        this.signer
                    );
                }
            }

            console.log("[ProofChainWeb3] MetaMask connected:", this.userAccount);
            this.updateWalletUI();
            return this.userAccount;
        } catch (error) {
            console.error("[ProofChainWeb3] User rejected connection or error occurred:", error);
            return null;
        }
    }

    updateWalletUI() {
        const btn = document.getElementById('wallet-connect-btn');
        if (btn && this.userAccount) {
            const shortAddr = `${this.userAccount.substring(0, 6)}...${this.userAccount.substring(38)}`;
            btn.innerHTML = `<span style="color:#00ff9d;">●</span> ${shortAddr}`;
            btn.style.borderColor = "#00ff9d";
        }
    }

    async getOnChainEvidence(evidenceId) {
        if (!this.contract) return null;
        try {
            const ev = await this.contract.getEvidence(evidenceId);
            return {
                evidenceId: ev[0],
                fileHash: ev[1],
                timestamp: Number(ev[2]),
                uploader: ev[3],
                metadataURI: ev[4],
                exists: ev[5]
            };
        } catch (e) {
            console.error("[ProofChainWeb3] Read error:", e);
            return null;
        }
    }
}

window.proofChainWeb3 = new ProofChainWeb3();
