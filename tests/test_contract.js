const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EvidenceRegistry Smart Contract Unit Tests", function () {
  let evidenceRegistry;
  let owner, uploader, investigator;

  const sampleEvId = "EVD-TEST-001";
  const sampleHash = "8f72a91bc42d98f72a91bc42d98f72a91bc42d98f72a91bc42d98f72a91bc42d";
  const metadataURI = "/api/evidence/EVD-TEST-001";

  beforeEach(async function () {
    [owner, uploader, investigator] = await ethers.getSigners();
    const EvidenceRegistry = await ethers.getContractFactory("EvidenceRegistry");
    evidenceRegistry = await EvidenceRegistry.deploy();
    await evidenceRegistry.waitForDeployment();
  });

  it("Should register new evidence on-chain with accurate hash and timestamp", async function () {
    await expect(evidenceRegistry.connect(uploader).registerEvidence(sampleEvId, sampleHash, metadataURI))
      .to.emit(evidenceRegistry, "EvidenceRegistered");

    const record = await evidenceRegistry.getEvidence(sampleEvId);
    expect(record[0]).to.equal(sampleEvId);
    expect(record[1]).to.equal(sampleHash);
    expect(record[3]).to.equal(uploader.address);
    expect(record[5]).to.be.true; // exists
  });

  it("Should reject duplicate Evidence ID registration", async function () {
    await evidenceRegistry.registerEvidence(sampleEvId, sampleHash, metadataURI);
    await expect(
      evidenceRegistry.registerEvidence(sampleEvId, sampleHash, metadataURI)
    ).to.be.revertedWith("Evidence ID already registered");
  });

  it("Should return TRUE for matching hash verification and FALSE for tampered candidate hash", async function () {
    await evidenceRegistry.registerEvidence(sampleEvId, sampleHash, metadataURI);

    // Verify exact hash
    const matchRes = await evidenceRegistry.verifyHash(sampleEvId, sampleHash);
    expect(matchRes[0]).to.be.true;

    // Verify altered hash
    const tamperedHash = "71bc82f190e38142a78129d91823bc821094821a73819273918273618239712a";
    const mismatchRes = await evidenceRegistry.verifyHash(sampleEvId, tamperedHash);
    expect(mismatchRes[0]).to.be.false;
  });

  it("Should record and retrieve chain of custody events", async function () {
    await evidenceRegistry.registerEvidence(sampleEvId, sampleHash, metadataURI);

    await evidenceRegistry.connect(investigator).addCustodyEvent(
      sampleEvId,
      "Evidence Analyzed",
      "Lead Cyber Forensics Examiner"
    );

    const history = await evidenceRegistry.getCustodyHistory(sampleEvId);
    expect(history.length).to.be.greaterThanOrEqual(2); // Initial registration + added event
    expect(history[1].action).to.equal("Evidence Analyzed");
    expect(history[1].personRole).to.equal("Lead Cyber Forensics Examiner");
    expect(history[1].actor).to.equal(investigator.address);
  });
});
