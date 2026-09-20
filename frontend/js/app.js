/**
 * ProofChain Main Frontend Application Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initFileUploadPreviews();
    initForms();
    initDemoSeed();
    loadDashboardData();
    loadEvidenceList();
    loadAlertsData();
});

// --- NAVIGATION & VIEW ROUTING ---
function initNavigation() {
    const navLinks = document.querySelectorAll(".nav-link");
    navLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            const targetView = link.getAttribute("data-view");
            if (!targetView) return;

            navLinks.forEach(l => l.classList.remove("active"));
            link.classList.add("active");

            document.querySelectorAll(".view-section").forEach(sec => {
                sec.classList.remove("active");
            });

            const activeSection = document.getElementById(`view-${targetView}`);
            if (activeSection) {
                activeSection.classList.add("active");
                // Refresh content on view switch
                if (targetView === 'dashboard') loadDashboardData();
                if (targetView === 'evidence') loadEvidenceList();
                if (targetView === 'alerts') loadAlertsData();
                if (targetView === 'explorer') loadExplorerData();
            }
        });
    });
}

// --- REAL CLIENT-SIDE SHA-256 PREVIEW ---
function initFileUploadPreviews() {
    const registerFileInput = document.getElementById("reg-file-input");
    const registerHashPreview = document.getElementById("reg-hash-preview");

    if (registerFileInput) {
        registerFileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (file && registerHashPreview) {
                registerHashPreview.textContent = "Calculating SHA-256 hash...";
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
                    registerHashPreview.textContent = hashHex;
                } catch (err) {
                    registerHashPreview.textContent = "Hash will be computed on server upload.";
                }
            }
        });
    }

    const verifyFileInput = document.getElementById("verify-file-input");
    const verifyHashPreview = document.getElementById("verify-hash-preview");

    if (verifyFileInput) {
        verifyFileInput.addEventListener("change", async (e) => {
            const file = e.target.files[0];
            if (file && verifyHashPreview) {
                verifyHashPreview.textContent = "Calculating SHA-256 hash...";
                try {
                    const arrayBuffer = await file.arrayBuffer();
                    const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
                    verifyHashPreview.textContent = hashHex;
                } catch (err) {
                    verifyHashPreview.textContent = "Hash will be computed on server verification.";
                }
            }
        });
    }
}

// --- DASHBOARD DATA ---
async function loadDashboardData() {
    try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) return;
        const data = await res.json();

        document.getElementById("stat-total").textContent = data.total_evidence || 0;
        document.getElementById("stat-verified").textContent = data.verified_evidence || 0;
        document.getElementById("stat-tampered").textContent = data.tampering_detected || 0;
        document.getElementById("stat-pending").textContent = data.pending_evidence || 0;

        // Video verification stats card
        if (data.video_verifications) {
            const vv = data.video_verifications;
            const totalEl = document.getElementById("stat-vv-total");
            const verEl = document.getElementById("stat-vv-verified");
            const pendEl = document.getElementById("stat-vv-pending");
            const failEl = document.getElementById("stat-vv-failed");
            if (totalEl) totalEl.textContent = vv.total || 0;
            if (verEl) verEl.textContent = vv.verified || 0;
            if (pendEl) pendEl.textContent = vv.pending || 0;
            if (failEl) failEl.textContent = vv.failed || 0;
        }

        // Render recent evidence table
        const tbody = document.getElementById("recent-evidence-tbody");
        if (tbody) {
            tbody.innerHTML = "";
            if (!data.recent_evidence || data.recent_evidence.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">No evidence records found. Click 'Seed Demo' to populate sample data.</td></tr>`;
            } else {
                data.recent_evidence.forEach(item => {
                    tbody.appendChild(createEvidenceTableRow(item));
                });
            }
        }

        // Render recent verification attempts
        const vList = document.getElementById("recent-verifications-list");
        if (vList) {
            vList.innerHTML = "";
            if (!data.recent_verifications || data.recent_verifications.length === 0) {
                vList.innerHTML = `<div style="color:var(--text-muted); font-size:0.85rem;">No verification attempts logged yet.</div>`;
            } else {
                data.recent_verifications.forEach(v => {
                    const badgeClass = v.status === "AUTHENTIC" ? "badge-authentic" : "badge-tampered";
                    vList.innerHTML += `
                        <div style="padding:0.75rem 0; border-bottom:1px solid rgba(255,255,255,0.05); font-size:0.85rem;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:0.2rem;">
                                <strong style="color:var(--accent-cyan);">${v.evidence_id}</strong>
                                <span class="badge ${badgeClass}">${v.status}</span>
                            </div>
                            <div style="color:var(--text-muted); font-size:0.78rem;">${v.result_message}</div>
                            <div style="font-size:0.72rem; color:var(--text-dim); margin-top:0.2rem;">By ${v.verified_by} • ${v.created_at}</div>
                        </div>
                    `;
                });
            }
        }
    } catch (e) {
        console.error("Dashboard data load error:", e);
    }
}

function createEvidenceTableRow(item) {
    const tr = document.createElement("tr");
    const statusClass = item.status === "VERIFIED" ? "badge-verified" : (item.status === "TAMPERED" ? "badge-tampered" : "badge-registered");
    const shortHash = item.file_hash ? `${item.file_hash.substring(0, 10)}...${item.file_hash.substring(58)}` : 'N/A';
    
    tr.innerHTML = `
        <td><strong style="color:var(--text-main);">${item.evidence_id}</strong></td>
        <td><span style="color:var(--text-muted);">${item.case_id}</span></td>
        <td>${item.evidence_type}</td>
        <td><span class="hash-code">${shortHash}</span></td>
        <td><span class="badge ${statusClass}">${item.status}</span></td>
        <td><button class="wallet-btn" style="padding:0.3rem 0.6rem; font-size:0.75rem;" onclick="viewEvidenceDetail('${item.evidence_id}')">View</button></td>
    `;
    return tr;
}

// --- EVIDENCE MANAGEMENT LIST ---
async function loadEvidenceList() {
    const search = document.getElementById("search-input") ? document.getElementById("search-input").value : "";
    const typeFilter = document.getElementById("type-filter") ? document.getElementById("type-filter").value : "";
    const statusFilter = document.getElementById("status-filter") ? document.getElementById("status-filter").value : "";

    try {
        const url = `/api/evidence?search=${encodeURIComponent(search)}&type=${encodeURIComponent(typeFilter)}&status=${encodeURIComponent(statusFilter)}`;
        const res = await fetch(url);
        const records = await res.json();

        const tbody = document.getElementById("all-evidence-tbody");
        if (tbody) {
            tbody.innerHTML = "";
            if (records.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color: var(--text-muted);">No matching evidence records.</td></tr>`;
            } else {
                records.forEach(item => {
                    tbody.appendChild(createEvidenceTableRow(item));
                });
            }
        }
    } catch (e) {
        console.error("Evidence list error:", e);
    }
}

// Filter listeners
document.addEventListener("input", (e) => {
    if (["search-input", "type-filter", "status-filter"].includes(e.target.id)) {
        loadEvidenceList();
    }
});

// --- FORM HANDLERS ---
function initForms() {
    // Evidence Registration Form
    const regForm = document.getElementById("register-evidence-form");
    if (regForm) {
        regForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = regForm.querySelector("button[type='submit']");
            btn.disabled = true;
            btn.textContent = "Calculating SHA-256 & Minting On-Chain...";

            const formData = new FormData(regForm);
            if (window.proofChainWeb3 && window.proofChainWeb3.userAccount) {
                formData.append("wallet_address", window.proofChainWeb3.userAccount);
            }

            try {
                const res = await fetch("/api/evidence/register", {
                    method: "POST",
                    body: formData
                });
                const result = await res.json();

                if (res.ok) {
                    alert(`✅ Evidence ${result.evidence.evidence_id} successfully registered!\nSHA-256: ${result.evidence.file_hash}\nTransaction: ${result.blockchain.tx_hash}`);
                    regForm.reset();
                    document.getElementById("reg-hash-preview").textContent = "File SHA-256 hash will appear here on selection.";
                    // Switch to Evidence View
                    document.querySelector("[data-view='evidence']").click();
                } else {
                    alert(`❌ Registration Error: ${result.error}`);
                }
            } catch (err) {
                alert(`❌ Network/Server Error: ${err.message}`);
            } finally {
                btn.disabled = false;
                btn.textContent = "Register Evidence On-Chain";
            }
        });
    }

    // Evidence Verification Form
    const verifyForm = document.getElementById("verify-evidence-form");
    if (verifyForm) {
        verifyForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const btn = verifyForm.querySelector("button[type='submit']");
            btn.disabled = true;
            btn.textContent = "Computing Cryptographic Match...";

            const formData = new FormData(verifyForm);
            const resultBox = document.getElementById("verify-result-container");

            try {
                const res = await fetch("/api/evidence/verify", {
                    method: "POST",
                    body: formData
                });
                const data = await res.json();

                if (res.ok) {
                    resultBox.className = `verify-result-box ${data.status.toLowerCase()}`;
                    resultBox.style.display = "block";

                    const isAuthentic = data.status === "AUTHENTIC";
                    const statusHeaderClass = isAuthentic ? "authentic" : "tampered";
                    const statusText = isAuthentic ? "EVIDENCE VERIFIED AUTHENTIC ✅" : "TAMPERING DETECTED ⚠️";

                    resultBox.innerHTML = `
                        <div class="result-header ${statusHeaderClass}">
                            ${statusText}
                        </div>
                        <p style="color:var(--text-main); font-size:0.95rem; margin-bottom:1rem;">
                            ${data.result_message}
                        </p>
                        <div class="hash-comparison-grid">
                            <div class="hash-box">
                                <label>ORIGINAL ON-CHAIN HASH</label>
                                <div class="hash-code">${data.original_hash}</div>
                            </div>
                            <div class="hash-box">
                                <label>UPLOADED FILE HASH</label>
                                <div class="hash-code">${data.current_hash}</div>
                            </div>
                        </div>
                        <div style="margin-top:1rem; font-size:0.8rem; color:var(--text-muted); display:flex; justify-content:space-between;">
                            <span>Evidence ID: <strong>${data.evidence_id}</strong></span>
                            <span>Verified By: <strong>${data.verified_by}</strong></span>
                        </div>
                    `;
                } else {
                    alert(`❌ Verification Failed: ${data.error}`);
                }
            } catch (err) {
                alert(`❌ Server Connection Error: ${err.message}`);
            } finally {
                btn.disabled = false;
                btn.textContent = "Run Integrity Verification";
            }
        });
    }

    // Custody Event Form
    const custodyForm = document.getElementById("add-custody-form");
    if (custodyForm) {
        custodyForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const evId = document.getElementById("custody-evidence-id").value;
            const action = document.getElementById("custody-action").value;
            const person = document.getElementById("custody-person").value;
            const role = document.getElementById("custody-role").value;
            const notes = document.getElementById("custody-notes").value;

            try {
                const res = await fetch(`/api/evidence/${evId}/custody`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action, person, role, notes })
                });

                if (res.ok) {
                    alert("✅ Chain of Custody event logged on blockchain!");
                    custodyForm.reset();
                    viewEvidenceDetail(evId);
                } else {
                    const err = await res.json();
                    alert(`❌ Failed to log custody event: ${err.error}`);
                }
            } catch (e) {
                alert(`❌ Network error: ${e.message}`);
            }
        });
    }
}

// --- EVIDENCE DETAIL VIEW & CUSTODY TIMELINE ---
async function viewEvidenceDetail(evidenceId) {
    try {
        const res = await fetch(`/api/evidence/${evidenceId}`);
        if (!res.ok) {
            alert("Could not retrieve evidence details.");
            return;
        }
        const data = await res.json();
        const ev = data.evidence;
        const custody = data.custody;
        const bc = data.blockchain;

        // Switch to Evidence View Section
        document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
        document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));

        const detailSection = document.getElementById("view-detail");
        detailSection.classList.add("active");

        // Populate Details
        document.getElementById("detail-id").textContent = ev.evidence_id;
        document.getElementById("detail-case").textContent = ev.case_id;
        document.getElementById("detail-title").textContent = ev.title;
        document.getElementById("detail-type").textContent = ev.evidence_type;
        document.getElementById("detail-filename").textContent = ev.original_filename;
        document.getElementById("detail-collector").textContent = ev.collector;
        document.getElementById("detail-location").textContent = ev.location;
        document.getElementById("detail-hash").textContent = ev.file_hash;
        document.getElementById("detail-tx").textContent = ev.tx_hash || 'N/A';
        document.getElementById("detail-block").textContent = ev.block_number || 'N/A';

        const statusBadge = document.getElementById("detail-status-badge");
        const statusClass = ev.status === "VERIFIED" ? "badge-verified" : (ev.status === "TAMPERED" ? "badge-tampered" : "badge-registered");
        statusBadge.className = `badge ${statusClass}`;
        statusBadge.textContent = ev.status;

        // Populate Chain of Custody Timeline
        const timeline = document.getElementById("custody-timeline-container");
        timeline.innerHTML = "";

        if (!custody || custody.length === 0) {
            timeline.innerHTML = `<div style="color:var(--text-muted);">No custody events recorded.</div>`;
        } else {
            custody.forEach(item => {
                const dateStr = new Date(item.timestamp * 1000).toLocaleString();
                timeline.innerHTML += `
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <div class="timeline-title">
                                <span>${item.action}</span>
                                <span style="font-size:0.75rem; color:var(--text-muted);">${dateStr}</span>
                            </div>
                            <div class="timeline-meta">
                                🧑‍⚖️ <strong>${item.person}</strong> (${item.role})
                            </div>
                            ${item.notes ? `<div style="font-size:0.8rem; color:var(--text-dim); margin-top:0.4rem;">${item.notes}</div>` : ''}
                            ${item.tx_hash ? `<div style="font-size:0.72rem; color:var(--accent-cyan); margin-top:0.4rem;" class="hash-code">TX: ${item.tx_hash}</div>` : ''}
                        </div>
                    </div>
                `;
            });
        }

        // Set hidden ID for adding new custody event
        document.getElementById("custody-evidence-id").value = ev.evidence_id;

    } catch (e) {
        console.error("View detail error:", e);
    }
}

// --- ALERTS VIEW ---
async function loadAlertsData() {
    try {
        const res = await fetch("/api/alerts");
        const alerts = await res.json();
        const container = document.getElementById("alerts-feed-container");
        container.innerHTML = "";

        if (alerts.length === 0) {
            container.innerHTML = `
                <div class="cyber-card" style="text-align:center; color:var(--text-muted);">
                    ✅ No security tampering alerts detected. All evidence records intact.
                </div>
            `;
        } else {
            alerts.forEach(alertItem => {
                container.innerHTML += `
                    <div class="alert-card">
                        <div class="alert-title">
                            ⚠️ TAMPERING ALERT DETECTED — EVIDENCE: ${alertItem.evidence_id}
                        </div>
                        <div style="font-size:0.88rem; color:var(--text-main); margin-bottom:0.75rem;">
                            ${alertItem.notes}
                        </div>
                        <div class="hash-comparison-grid">
                            <div class="hash-box">
                                <label>EXPECTED ORIGINAL HASH</label>
                                <div class="hash-code">${alertItem.original_hash}</div>
                            </div>
                            <div class="hash-box">
                                <label>RECEIVED TAMPERED HASH</label>
                                <div class="hash-code" style="color:var(--status-tampered);">${alertItem.computed_hash}</div>
                            </div>
                        </div>
                        <div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.75rem;">
                            Attempted By: ${alertItem.attempted_by} • Logged At: ${alertItem.created_at}
                        </div>
                    </div>
                `;
            });
        }
    } catch (e) {
        console.error("Alerts error:", e);
    }
}

// --- BLOCKCHAIN EXPLORER VIEW ---
async function loadExplorerData() {
    try {
        const res = await fetch("/api/dashboard/stats");
        const data = await res.json();
        const bc = data.blockchain;

        document.getElementById("explorer-status").textContent = bc.connected ? "CONNECTED (Hardhat Node)" : "OFFLINE";
        document.getElementById("explorer-rpc").textContent = bc.rpc_url;
        document.getElementById("explorer-contract").textContent = bc.contract_address || 'Not Deployed';
        document.getElementById("explorer-block").textContent = bc.block_number;
    } catch (e) {
        console.error("Explorer load error:", e);
    }
}

// --- DEMO SEED BUTTON ---
function initDemoSeed() {
    const seedBtn = document.getElementById("seed-demo-btn");
    if (seedBtn) {
        seedBtn.addEventListener("click", async () => {
            if (confirm("Reset and seed sample demonstration evidence data?")) {
                try {
                    const res = await fetch("/api/demo/seed", { method: "POST" });
                    if (res.ok) {
                        alert("✅ Demonstration dataset successfully initialized!");
                        loadDashboardData();
                        loadEvidenceList();
                        loadAlertsData();
                    }
                } catch (e) {
                    alert("Error seeding data: " + e.message);
                }
            }
        });
    }
}
