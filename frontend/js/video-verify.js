/**
 * ProofChain – Video Verification Frontend Module
 * Handles: camera access, MediaRecorder, file upload, challenge display,
 * submission, processing animation, result rendering, history, certificates, QR codes.
 *
 * Integrates with the existing ProofChain SPA navigation (data-view system).
 * Called by initNavigation() when the user visits 'video-verify' view.
 */

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const VV = {
    stream: null,           // MediaStream
    mediaRecorder: null,    // MediaRecorder instance
    recordedChunks: [],     // Collected video chunks
    recordedBlob: null,     // Final recorded Blob
    uploadedFile: null,     // User-uploaded File
    videoToSubmit: null,    // Blob | File ready for upload
    challenge: null,        // Currently displayed challenge string
    activeTab: 'camera',    // 'camera' | 'upload'
    timerInterval: null,    // setInterval reference for recording timer
    timerSeconds: 0,        // Elapsed recording seconds
    maxDuration: 30,        // Max allowed recording seconds
    isRecording: false,
    evidenceId: null,       // Linked evidence ID
};

const CHALLENGES = [
    "Please look at the camera and say: I am verifying this proof.",
    "Please hold up one finger and say: This evidence is authentic.",
    "Please nod your head and say: ProofChain verification confirmed.",
    "Please say clearly: My ProofChain verification is valid.",
    "Please turn slightly to the left, then right, then look at the camera.",
    "Please say: I certify this digital evidence is unaltered.",
];

// ---------------------------------------------------------------------------
// Init (called from DOMContentLoaded in app.js integration below)
// ---------------------------------------------------------------------------
function initVideoVerification() {
    selectNewChallenge();
    initVideoTabs();
    initVideoForm();
    loadVideoHistory();

    // Refresh challenge & history when view becomes active
    document.querySelector('[data-view="video-verify"]')?.addEventListener('click', () => {
        selectNewChallenge();
        loadVideoHistory();
    });
}

// ---------------------------------------------------------------------------
// Challenge Selection
// ---------------------------------------------------------------------------
function selectNewChallenge() {
    VV.challenge = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
    const el = document.getElementById('vv-challenge-text');
    if (el) el.textContent = `"${VV.challenge}"`;
}

// ---------------------------------------------------------------------------
// Tab Toggle: Camera / Upload
// ---------------------------------------------------------------------------
function initVideoTabs() {
    const camerBtn = document.getElementById('vv-tab-camera');
    const uploadBtn = document.getElementById('vv-tab-upload');
    const cameraPanel = document.getElementById('vv-camera-panel');
    const uploadPanel = document.getElementById('vv-upload-panel');

    camerBtn?.addEventListener('click', () => {
        VV.activeTab = 'camera';
        camerBtn.classList.add('active');
        uploadBtn.classList.remove('active');
        cameraPanel.style.display = 'block';
        uploadPanel.style.display = 'none';
        // Reset upload state
        VV.uploadedFile = null;
        VV.videoToSubmit = VV.recordedBlob || null;
    });

    uploadBtn?.addEventListener('click', () => {
        VV.activeTab = 'upload';
        uploadBtn.classList.add('active');
        camerBtn.classList.remove('active');
        cameraPanel.style.display = 'none';
        uploadPanel.style.display = 'block';
        stopCameraStream();
    });

    document.getElementById('vv-refresh-challenge')?.addEventListener('click', selectNewChallenge);
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------
async function startCamera() {
    const previewEl = document.getElementById('vv-camera-preview');
    const placeholder = document.getElementById('vv-camera-placeholder');
    const startBtn = document.getElementById('vv-start-camera-btn');

    try {
        VV.stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
            audio: true
        });
        previewEl.srcObject = VV.stream;
        previewEl.style.display = 'block';
        placeholder.style.display = 'none';
        startBtn.style.display = 'none';

        document.getElementById('vv-record-btn').disabled = false;
        document.getElementById('vv-status-text').textContent = 'Camera ready. Press Record when ready.';
    } catch (err) {
        let message = 'Camera access failed.';
        if (err.name === 'NotAllowedError') {
            message = '⚠️ Camera permission denied. Please allow camera access in your browser settings and try again.';
        } else if (err.name === 'NotFoundError') {
            message = '⚠️ No camera device found on this device.';
        } else if (err.name === 'NotSupportedError') {
            message = '⚠️ Camera is not supported in this browser. Try Chrome or Firefox.';
        } else {
            message = `⚠️ Camera Error: ${err.message}`;
        }
        showVVError(message);
    }
}

function stopCameraStream() {
    if (VV.stream) {
        VV.stream.getTracks().forEach(t => t.stop());
        VV.stream = null;
    }
    const previewEl = document.getElementById('vv-camera-preview');
    if (previewEl) {
        previewEl.srcObject = null;
        previewEl.style.display = 'none';
    }
}

// ---------------------------------------------------------------------------
// Recording
// ---------------------------------------------------------------------------
function startRecording() {
    if (!VV.stream) { showVVError('Start the camera first.'); return; }

    VV.recordedChunks = [];
    VV.recordedBlob = null;
    VV.videoToSubmit = null;

    const mimeType = getSupportedMimeType();
    try {
        VV.mediaRecorder = new MediaRecorder(VV.stream, { mimeType });
    } catch (e) {
        VV.mediaRecorder = new MediaRecorder(VV.stream);
    }

    VV.mediaRecorder.ondataavailable = e => {
        if (e.data && e.data.size > 0) VV.recordedChunks.push(e.data);
    };

    VV.mediaRecorder.onstop = () => {
        const mimeUsed = VV.mediaRecorder.mimeType || 'video/webm';
        VV.recordedBlob = new Blob(VV.recordedChunks, { type: mimeUsed });
        VV.videoToSubmit = VV.recordedBlob;
        showVideoPreview(VV.recordedBlob);
        document.getElementById('vv-submit-section').style.display = 'block';
        document.getElementById('vv-status-text').textContent = 'Recording complete. Review your video and submit.';
    };

    VV.mediaRecorder.start(100);
    VV.isRecording = true;
    startTimer();

    // UI state
    document.getElementById('vv-record-btn').disabled = true;
    document.getElementById('vv-stop-btn').disabled = false;
    document.getElementById('vv-recorder-box').classList.add('recording');
    document.getElementById('vv-overlay').style.display = 'flex';
    document.getElementById('vv-status-text').textContent = '● Recording in progress...';

    // Auto-stop at maxDuration
    setTimeout(() => {
        if (VV.isRecording) stopRecording();
    }, VV.maxDuration * 1000);
}

function stopRecording() {
    if (VV.mediaRecorder && VV.isRecording) {
        VV.mediaRecorder.stop();
        VV.isRecording = false;
        clearInterval(VV.timerInterval);

        document.getElementById('vv-record-btn').disabled = false;
        document.getElementById('vv-stop-btn').disabled = true;
        document.getElementById('vv-recorder-box').classList.remove('recording');
        document.getElementById('vv-overlay').style.display = 'none';
    }
}

function startTimer() {
    VV.timerSeconds = 0;
    clearInterval(VV.timerInterval);
    VV.timerInterval = setInterval(() => {
        VV.timerSeconds++;
        const m = String(Math.floor(VV.timerSeconds / 60)).padStart(2, '0');
        const s = String(VV.timerSeconds % 60).padStart(2, '0');
        const max = String(Math.floor(VV.maxDuration / 60)).padStart(2, '0') + ':' + String(VV.maxDuration % 60).padStart(2, '0');
        const el = document.getElementById('vv-timer-display');
        if (el) el.textContent = `${m}:${s} / ${max}`;
    }, 1000);
}

function getSupportedMimeType() {
    const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
    for (const t of types) {
        if (MediaRecorder.isTypeSupported(t)) return t;
    }
    return '';
}

// ---------------------------------------------------------------------------
// Video Preview
// ---------------------------------------------------------------------------
function showVideoPreview(blob) {
    const previewEl = document.getElementById('vv-preview-video');
    const previewSection = document.getElementById('vv-preview-section');
    if (!previewEl || !previewSection) return;

    const url = URL.createObjectURL(blob);
    previewEl.src = url;
    previewSection.style.display = 'block';
}

function retakeVideo() {
    VV.recordedBlob = null;
    VV.recordedChunks = [];
    VV.videoToSubmit = null;

    const previewSection = document.getElementById('vv-preview-section');
    const submitSection = document.getElementById('vv-submit-section');
    const resultContainer = document.getElementById('vv-result-container');

    if (previewSection) previewSection.style.display = 'none';
    if (submitSection) submitSection.style.display = 'none';
    if (resultContainer) resultContainer.innerHTML = '';

    document.getElementById('vv-status-text').textContent = 'Camera ready. Press Record when ready.';
    document.getElementById('vv-record-btn').disabled = false;
    document.getElementById('vv-stop-btn').disabled = true;
}

// ---------------------------------------------------------------------------
// File Upload Tab
// ---------------------------------------------------------------------------
function initUploadDropzone() {
    const input = document.getElementById('vv-upload-input');
    const preview = document.getElementById('vv-upload-preview');
    const label = document.getElementById('vv-upload-label');

    if (!input) return;

    input.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        handleUploadedFile(file);
    });

    label?.addEventListener('dragover', e => { e.preventDefault(); label.classList.add('dragover'); });
    label?.addEventListener('dragleave', () => label.classList.remove('dragover'));
    label?.addEventListener('drop', e => {
        e.preventDefault();
        label.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) handleUploadedFile(file);
    });
}

function handleUploadedFile(file) {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedExt = /\.(mp4|webm|mov)$/i;

    if (!allowedTypes.includes(file.type) && !allowedExt.test(file.name)) {
        showVVError(`Unsupported format: ${file.type || file.name}. Please upload an MP4, WebM, or MOV video.`);
        return;
    }

    const maxBytes = 100 * 1024 * 1024;
    if (file.size > maxBytes) {
        showVVError(`File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum allowed is 100 MB.`);
        return;
    }

    VV.uploadedFile = file;
    VV.videoToSubmit = file;

    const previewEl = document.getElementById('vv-upload-preview-video');
    if (previewEl) {
        previewEl.src = URL.createObjectURL(file);
        document.getElementById('vv-upload-preview').style.display = 'block';
    }

    document.getElementById('vv-upload-filename').textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    document.getElementById('vv-submit-section').style.display = 'block';
    clearVVError();
}

// ---------------------------------------------------------------------------
// Form Initialization & Submission
// ---------------------------------------------------------------------------
function initVideoForm() {
    initUploadDropzone();

    document.getElementById('vv-start-camera-btn')?.addEventListener('click', startCamera);
    document.getElementById('vv-record-btn')?.addEventListener('click', startRecording);
    document.getElementById('vv-stop-btn')?.addEventListener('click', stopRecording);
    document.getElementById('vv-retake-btn')?.addEventListener('click', retakeVideo);
    document.getElementById('vv-upload-retake-btn')?.addEventListener('click', () => {
        VV.uploadedFile = null;
        VV.videoToSubmit = null;
        document.getElementById('vv-upload-preview').style.display = 'none';
        document.getElementById('vv-submit-section').style.display = 'none';
        document.getElementById('vv-result-container').innerHTML = '';
        document.getElementById('vv-upload-input').value = '';
    });

    document.getElementById('vv-submit-form')?.addEventListener('submit', handleVideoSubmit);
}

async function handleVideoSubmit(e) {
    e.preventDefault();
    clearVVError();

    const evidenceId = document.getElementById('vv-evidence-id').value.trim();
    const challengeResponse = document.getElementById('vv-challenge-response').value.trim();

    if (!evidenceId) { showVVError('Please enter an Evidence ID to link this video to.'); return; }
    if (!VV.videoToSubmit) { showVVError('No video ready. Please record or upload a video first.'); return; }
    if (!VV.challenge) { showVVError('No challenge loaded. Please refresh the page.'); return; }

    VV.evidenceId = evidenceId;

    // Determine filename extension
    let ext = 'webm';
    if (VV.videoToSubmit instanceof File) {
        ext = VV.videoToSubmit.name.split('.').pop().toLowerCase() || 'webm';
    } else {
        const mime = VV.videoToSubmit.type || 'video/webm';
        if (mime.includes('mp4')) ext = 'mp4';
        else if (mime.includes('quicktime')) ext = 'mov';
    }

    const filename = `verification_${Date.now()}.${ext}`;
    const videoFile = VV.videoToSubmit instanceof File
        ? VV.videoToSubmit
        : new File([VV.videoToSubmit], filename, { type: VV.videoToSubmit.type });

    // Build form data
    const formData = new FormData();
    formData.append('video', videoFile, filename);
    formData.append('evidence_id', evidenceId);
    formData.append('challenge_text', VV.challenge);
    formData.append('challenge_response', challengeResponse);

    showProcessingState();

    try {
        // Animate steps
        await animateStep('step-upload', 800);
        await animateStep('step-hash', 1000);
        await animateStep('step-integrity', 800);
        await animateStep('step-analysis', 0); // stays spinning while fetch runs

        const res = await fetch('/api/video-verification/upload', {
            method: 'POST',
            body: formData
        });

        const data = await res.json();

        completeStep('step-analysis');
        await animateStep('step-result', 400);

        if (res.ok) {
            renderVerificationResult(data);
            loadVideoHistory();
            // Refresh dashboard stat card
            if (typeof loadDashboardData === 'function') loadDashboardData();
        } else {
            hideProcessingState();
            showVVError(`❌ Verification failed: ${data.error || 'Unknown server error.'}`);
        }
    } catch (err) {
        hideProcessingState();
        showVVError(`❌ Network error: ${err.message}. Is the Flask server running?`);
    }
}

// ---------------------------------------------------------------------------
// Processing State Animation
// ---------------------------------------------------------------------------
function showProcessingState() {
    const submitSection = document.getElementById('vv-submit-section');
    const processingSection = document.getElementById('vv-processing-section');
    const resultContainer = document.getElementById('vv-result-container');

    if (submitSection) submitSection.style.display = 'none';
    if (processingSection) processingSection.style.display = 'block';
    if (resultContainer) resultContainer.innerHTML = '';

    // Reset all steps
    ['step-upload', 'step-hash', 'step-integrity', 'step-analysis', 'step-result'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.className = 'processing-item'; el.querySelector('.processing-icon').textContent = '○'; }
    });
}

function hideProcessingState() {
    const submitSection = document.getElementById('vv-submit-section');
    const processingSection = document.getElementById('vv-processing-section');
    if (submitSection) submitSection.style.display = 'block';
    if (processingSection) processingSection.style.display = 'none';
}

function animateStep(stepId, delayMs) {
    return new Promise(resolve => {
        const el = document.getElementById(stepId);
        if (el) {
            el.className = 'processing-item active';
            el.querySelector('.processing-icon').textContent = '↻';
        }
        setTimeout(() => {
            if (el && delayMs > 0) {
                el.className = 'processing-item done';
                el.querySelector('.processing-icon').textContent = '✓';
            }
            resolve();
        }, delayMs);
    });
}

function completeStep(stepId) {
    const el = document.getElementById(stepId);
    if (el) {
        el.className = 'processing-item done';
        el.querySelector('.processing-icon').textContent = '✓';
    }
}

// ---------------------------------------------------------------------------
// Verification Result Rendering
// ---------------------------------------------------------------------------
function renderVerificationResult(data) {
    const processingSection = document.getElementById('vv-processing-section');
    const resultContainer = document.getElementById('vv-result-container');

    if (processingSection) processingSection.style.display = 'none';

    const v = data.verification;
    const checks = data.checks || [];
    const evidence = data.evidence || {};
    const statusLower = (v.overall_status || 'PENDING').toLowerCase();

    const statusEmoji = { verified: '✅', failed: '❌', pending: '⏳', expired: '🕐', revoked: '🚫' };
    const statusLabel = { verified: 'VERIFIED', failed: 'FAILED', pending: 'PENDING REVIEW', expired: 'EXPIRED', revoked: 'REVOKED' };

    const checksHtml = checks.map(c => {
        const st = (c.status || 'UNCHECKED').toLowerCase().replace(/_/g, ' ');
        return `
            <div class="vv-check-row" title="${c.detail || ''}">
                <span class="vv-check-name">${c.name}</span>
                <span class="vv-check-status ${st.replace(/ /g, '_')}">${st.toUpperCase()}</span>
            </div>`;
    }).join('');

    const shortHash = v.video_hash ? `${v.video_hash.substring(0, 16)}...${v.video_hash.substring(56)}` : 'N/A';
    const fullHash = v.video_hash || 'N/A';
    const createdAt = v.created_at || new Date().toLocaleString();

    resultContainer.innerHTML = `
        <div class="vv-result-card ${statusLower}" id="vv-result-inner">
            <div class="vv-result-header">
                <span class="vv-status-icon">${statusEmoji[statusLower] || '⏳'}</span>
                <div>
                    <div class="vv-status-text ${statusLower}">VIDEO VERIFICATION — ${statusLabel[statusLower] || v.overall_status}</div>
                    <div style="font-size:0.8rem; color:var(--text-muted); margin-top:0.25rem;">Verification ID: <strong style="color:var(--accent-cyan); font-family:var(--font-mono);">${v.verification_id}</strong></div>
                </div>
            </div>

            <div class="vv-checks-grid">${checksHtml}</div>

            <div class="vv-meta-grid" style="margin-bottom:1.25rem;">
                <div class="vv-meta-box">
                    <div class="vv-meta-label">Video SHA-256</div>
                    <div class="vv-meta-value" title="${fullHash}">${shortHash}</div>
                </div>
                <div class="vv-meta-box">
                    <div class="vv-meta-label">Linked Evidence</div>
                    <div class="vv-meta-value">${evidence.evidence_id || v.evidence_id}</div>
                </div>
                <div class="vv-meta-box">
                    <div class="vv-meta-label">Document Status</div>
                    <div class="vv-meta-value" style="color:var(--status-verified);">${evidence.status || 'N/A'}</div>
                </div>
                <div class="vv-meta-box">
                    <div class="vv-meta-label">Timestamp</div>
                    <div class="vv-meta-value" style="color:var(--text-muted); font-size:0.74rem;">${createdAt}</div>
                </div>
                <div class="vv-meta-box" style="grid-column: 1/-1;">
                    <div class="vv-meta-label">Access Status</div>
                    <div class="vv-meta-value">🔒 ${v.access_status || 'Private'}</div>
                </div>
            </div>

            <div style="margin-top:1rem; border-top:1px solid rgba(255,255,255,0.06); padding-top:1rem; display:flex; gap:0.75rem; flex-wrap:wrap;">
                <button class="btn-primary" style="font-size:0.82rem; padding:0.55rem 1.1rem;" onclick="generateCertificate(${JSON.stringify(data).replace(/"/g, '&quot;')})">
                    📄 Generate Certificate
                </button>
                <button class="btn-retake" onclick="retakeVideo(); document.getElementById('vv-result-container').innerHTML='';">
                    ↩ New Verification
                </button>
            </div>

            <div id="vv-certificate-container" style="display:none;"></div>
        </div>
    `;
}

// ---------------------------------------------------------------------------
// Certificate Generation
// ---------------------------------------------------------------------------
function generateCertificate(data) {
    const v = data.verification;
    const evidence = data.evidence || {};
    const container = document.getElementById('vv-certificate-container');
    if (!container) return;

    const verifyUrl = `${window.location.origin}/api/video-verification/${v.verification_id}`;
    const shortHash = v.video_hash ? `${v.video_hash.substring(0, 32)}...` : 'N/A';

    container.style.display = 'block';
    container.innerHTML = `
        <div class="vv-certificate">
            <div class="vv-certificate-title">⛓️ ProofChain Verification Certificate</div>
            <div style="text-align:center; margin-bottom:1rem;">
                <div id="vv-qr-container"></div>
            </div>
            <div>Proof ID:             <strong style="color:var(--text-main);">${evidence.evidence_id || v.evidence_id}</strong></div>
            <div>Video Verification ID: <strong style="color:var(--accent-cyan);">${v.verification_id}</strong></div>
            <div>Document Integrity:    <strong style="color:var(--status-verified);">${evidence.status || 'N/A'}</strong></div>
            <div>Video Integrity:       <strong style="color:var(--status-verified);">${v.integrity_result}</strong></div>
            <div>Challenge Response:    <strong style="color:var(--status-verified);">${v.challenge_result}</strong></div>
            <div>Overall Status:        <strong style="color:var(--status-verified);">${v.overall_status}</strong></div>
            <div>Verification Time:     ${v.created_at}</div>
            <div>Access Status:         🔒 ${v.access_status}</div>
            <div style="margin-top:0.75rem;">SHA-256: <span style="color:var(--accent-cyan);">${shortHash}</span></div>
            <div style="margin-top:0.5rem; font-size:0.7rem; color:var(--text-dim);">Scan QR code or visit: ${verifyUrl}</div>
        </div>
        <div class="vv-cert-actions">
            <button class="btn-primary" style="font-size:0.8rem; padding:0.5rem 1rem;" onclick="window.print()">🖨️ Print Certificate</button>
        </div>
    `;

    // Generate QR Code if library is available
    generateQRCode('vv-qr-container', verifyUrl);
}

function generateQRCode(containerId, text) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Try qrcode.js (loaded via CDN in index.html)
    if (typeof QRCode !== 'undefined') {
        container.innerHTML = '';
        new QRCode(container, {
            text: text,
            width: 120,
            height: 120,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.M
        });
    } else {
        // Fallback: show URL as text
        container.innerHTML = `<div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--accent-cyan); word-break:break-all; padding:0.5rem;">${text}</div>`;
    }
}

// ---------------------------------------------------------------------------
// Video Verification History
// ---------------------------------------------------------------------------
async function loadVideoHistory() {
    const container = document.getElementById('vv-history-list');
    if (!container) return;

    try {
        const res = await fetch('/api/video-verification/history?limit=20');
        if (!res.ok) { container.innerHTML = `<div style="color:var(--text-muted);">Could not load history.</div>`; return; }
        const records = await res.json();

        if (!records || records.length === 0) {
            container.innerHTML = `<div style="color:var(--text-muted); font-size:0.88rem; text-align:center; padding:1.5rem 0;">No video verifications yet. Submit your first verification above.</div>`;
            return;
        }

        container.innerHTML = records.map(r => {
            const statusClass = r.overall_status === 'VERIFIED' ? 'badge-verified' :
                r.overall_status === 'FAILED' ? 'badge-tampered' : 'badge-registered';
            const statusIcon = r.overall_status === 'VERIFIED' ? '✓' : r.overall_status === 'FAILED' ? '✕' : '⏳';

            return `
            <div class="vv-history-item">
                <div style="flex:1; min-width:0;">
                    <div class="vv-history-id">${r.verification_id}</div>
                    <div class="vv-history-meta">
                        <span>Proof: <strong>${r.evidence_id}</strong></span>
                        <span>•</span>
                        <span>${r.format?.toUpperCase() || 'VIDEO'}</span>
                        <span>•</span>
                        <span>${r.created_at || ''}</span>
                    </div>
                    <div style="margin-top:0.4rem; font-size:0.75rem; color:var(--text-dim);">
                        🔒 ${r.access_status || 'Private'}
                    </div>
                </div>
                <div class="vv-history-actions">
                    <span class="badge ${statusClass}">${statusIcon} ${r.overall_status}</span>
                    <button class="wallet-btn" style="padding:0.3rem 0.6rem; font-size:0.72rem;" onclick="viewVVDetail('${r.verification_id}')">View</button>
                </div>
            </div>
            `;
        }).join('');
    } catch (e) {
        container.innerHTML = `<div style="color:var(--text-muted);">Error loading history: ${e.message}</div>`;
    }
}

async function viewVVDetail(verificationId) {
    try {
        const res = await fetch(`/api/video-verification/${verificationId}`);
        if (!res.ok) { alert('Could not load verification record.'); return; }
        const v = await res.json();

        const modal = document.getElementById('vv-detail-modal');
        const content = document.getElementById('vv-detail-content');
        if (!modal || !content) return;

        const statusLower = (v.overall_status || 'pending').toLowerCase();
        const statusEmoji = { verified: '✅', failed: '❌', pending: '⏳' };
        const shortHash = v.video_hash ? `${v.video_hash.substring(0, 20)}...${v.video_hash.substring(52)}` : 'N/A';

        content.innerHTML = `
            <div style="margin-bottom:1.5rem;">
                <div class="vv-result-header" style="margin-bottom:1rem; padding-bottom:0.75rem; border-bottom:1px solid var(--glass-border);">
                    <span style="font-size:2rem;">${statusEmoji[statusLower] || '⏳'}</span>
                    <div>
                        <div class="vv-status-text ${statusLower}" style="font-size:1.1rem;">${v.overall_status}</div>
                        <div style="font-size:0.78rem; color:var(--text-muted);">${v.verification_id}</div>
                    </div>
                </div>
                <table style="width:100%; font-size:0.85rem; border-collapse:collapse;">
                    <tr><td style="color:var(--text-muted); padding:0.4rem 0; width:140px;">Evidence ID</td><td><strong style="color:var(--accent-cyan);">${v.evidence_id}</strong></td></tr>
                    <tr><td style="color:var(--text-muted); padding:0.4rem 0;">Integrity</td><td><span class="badge ${v.integrity_result === 'PASS' ? 'badge-verified' : 'badge-tampered'}">${v.integrity_result}</span></td></tr>
                    <tr><td style="color:var(--text-muted); padding:0.4rem 0;">Challenge</td><td><span class="badge ${v.challenge_result === 'PASS' ? 'badge-verified' : 'badge-registered'}">${v.challenge_result}</span></td></tr>
                    <tr><td style="color:var(--text-muted); padding:0.4rem 0;">Audio</td><td>${v.audio_check_result}</td></tr>
                    <tr><td style="color:var(--text-muted); padding:0.4rem 0;">Face</td><td>${v.face_check_result}</td></tr>
                    <tr><td style="color:var(--text-muted); padding:0.4rem 0;">Format</td><td>${(v.format || 'N/A').toUpperCase()}</td></tr>
                    <tr><td style="color:var(--text-muted); padding:0.4rem 0;">Access</td><td>🔒 ${v.access_status}</td></tr>
                    <tr><td style="color:var(--text-muted); padding:0.4rem 0;">Created</td><td>${v.created_at}</td></tr>
                    <tr><td style="color:var(--text-muted); padding:0.4rem 0;">SHA-256</td><td><span class="hash-code" style="font-size:0.72rem;">${shortHash}</span></td></tr>
                </table>
            </div>
        `;
        modal.style.display = 'flex';
    } catch (e) {
        alert(`Error loading details: ${e.message}`);
    }
}

function closeVVModal() {
    const modal = document.getElementById('vv-detail-modal');
    if (modal) modal.style.display = 'none';
}

// ---------------------------------------------------------------------------
// Error Display
// ---------------------------------------------------------------------------
function showVVError(message) {
    const el = document.getElementById('vv-error-msg');
    if (el) { el.textContent = message; el.style.display = 'block'; }
}

function clearVVError() {
    const el = document.getElementById('vv-error-msg');
    if (el) { el.textContent = ''; el.style.display = 'none'; }
}

// ---------------------------------------------------------------------------
// Auto-init when DOM is ready
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    initVideoVerification();

    // Hook into existing navigation to refresh when visiting the video view
    const origInit = window._vvInitialized;
    if (!origInit) {
        window._vvInitialized = true;
    }
});
