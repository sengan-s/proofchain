// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EvidenceRegistry
 * @dev Smart Contract for registering and verifying digital evidence integrity for ProofChain.
 */
contract EvidenceRegistry {
    struct Evidence {
        string evidenceId;
        string fileHash; // SHA-256 hex string
        uint256 timestamp;
        address uploader;
        string metadataURI;
        bool exists;
    }

    struct CustodyEvent {
        string evidenceId;
        string action;
        string personRole;
        uint256 timestamp;
        address actor;
    }

    // Mapping from Evidence ID -> Evidence record
    mapping(string => Evidence) private registry;

    // Mapping from Evidence ID -> Array of Chain of Custody events
    mapping(string => CustodyEvent[]) private custodyHistory;

    // List of all registered Evidence IDs for iteration
    string[] private evidenceIds;

    // Events
    event EvidenceRegistered(
        string indexed evidenceId,
        string fileHash,
        address indexed uploader,
        uint256 timestamp
    );

    event CustodyEventAdded(
        string indexed evidenceId,
        string action,
        string personRole,
        address indexed actor,
        uint256 timestamp
    );

    /**
     * @dev Register new evidence fingerprint on-chain
     */
    function registerEvidence(
        string calldata evidenceId,
        string calldata fileHash,
        string calldata metadataURI
    ) external {
        require(bytes(evidenceId).length > 0, "Evidence ID cannot be empty");
        require(bytes(fileHash).length > 0, "SHA-256 hash cannot be empty");
        require(!registry[evidenceId].exists, "Evidence ID already registered");

        registry[evidenceId] = Evidence({
            evidenceId: evidenceId,
            fileHash: fileHash,
            timestamp: block.timestamp,
            uploader: msg.sender,
            metadataURI: metadataURI,
            exists: true
        });

        evidenceIds.push(evidenceId);

        emit EvidenceRegistered(
            evidenceId,
            fileHash,
            msg.sender,
            block.timestamp
        );

        // Add initial custody record (COLLECTED)
        custodyHistory[evidenceId].push(CustodyEvent({
            evidenceId: evidenceId,
            action: "Evidence Collected & Registered",
            personRole: "Initial Registrar",
            timestamp: block.timestamp,
            actor: msg.sender
        }));
    }

    /**
     * @dev Retrieve recorded evidence details by Evidence ID
     */
    function getEvidence(string calldata evidenceId)
        external
        view
        returns (
            string memory id,
            string memory fileHash,
            uint256 timestamp,
            address uploader,
            string memory metadataURI,
            bool exists
        )
    {
        require(registry[evidenceId].exists, "Evidence record not found");
        Evidence memory ev = registry[evidenceId];
        return (
            ev.evidenceId,
            ev.fileHash,
            ev.timestamp,
            ev.uploader,
            ev.metadataURI,
            ev.exists
        );
    }

    /**
     * @dev Verify if a candidate hash matches the recorded evidence hash
     */
    function verifyHash(string calldata evidenceId, string calldata candidateHash)
        external
        view
        returns (bool matches, string memory originalHash, uint256 timestamp)
    {
        require(registry[evidenceId].exists, "Evidence record not found");
        Evidence memory ev = registry[evidenceId];
        
        // Compare SHA-256 string hashes byte by byte via keccak256
        bool isMatch = (keccak256(bytes(ev.fileHash)) == keccak256(bytes(candidateHash)));
        return (isMatch, ev.fileHash, ev.timestamp);
    }

    /**
     * @dev Append a new chain of custody event
     */
    function addCustodyEvent(
        string calldata evidenceId,
        string calldata action,
        string calldata personRole
    ) external {
        require(registry[evidenceId].exists, "Evidence record not found");
        require(bytes(action).length > 0, "Action cannot be empty");

        CustodyEvent memory newEvent = CustodyEvent({
            evidenceId: evidenceId,
            action: action,
            personRole: personRole,
            timestamp: block.timestamp,
            actor: msg.sender
        });

        custodyHistory[evidenceId].push(newEvent);

        emit CustodyEventAdded(
            evidenceId,
            action,
            personRole,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Get full chain of custody history for an evidence record
     */
    function getCustodyHistory(string calldata evidenceId)
        external
        view
        returns (CustodyEvent[] memory)
    {
        require(registry[evidenceId].exists, "Evidence record not found");
        return custodyHistory[evidenceId];
    }

    /**
     * @dev Get total number of registered evidence records
     */
    function getTotalEvidenceCount() external view returns (uint256) {
        return evidenceIds.length;
    }

    /**
     * @dev Get evidence ID by index
     */
    function getEvidenceIdByIndex(uint256 index) external view returns (string memory) {
        require(index < evidenceIds.length, "Index out of bounds");
        return evidenceIds[index];
    }
}
