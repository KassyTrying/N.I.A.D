// Constants and state
const BACKEND_URL = 'http://localhost:5000';
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const scanStatus = document.querySelector('.scan-status');
const results = document.querySelector('.results');
const sourcesContainer = document.querySelector('.dnd-sources');
let sources = document.querySelectorAll('.source');

// Track current dropped source (so we can reset if a different file is dropped)
let currentDroppedSource = null;
let scannerReady = false;
// track drag/drop state so we pause/resume star animation correctly
let isDragging = false;
let isDropped = false;
// only allow the progress bar 'fill' after a user explicitly drops or selects data
let allowProgressFill = false;

// Initialize drag and drop functionality
function wireSourceEvents() {
    sources = document.querySelectorAll('.source');
    sources.forEach(source => {
        source.removeEventListener('dragstart', handleDragStart);
        source.removeEventListener('dragend', handleDragEnd);
        source.addEventListener('dragstart', handleDragStart);
        source.addEventListener('dragend', handleDragEnd);
        // set draggable based on scannerReady
        source.draggable = !!scannerReady;
    });
}
wireSourceEvents();

dropzone.addEventListener('dragenter', handleDragEnter);
dropzone.addEventListener('dragleave', handleDragLeave);
dropzone.addEventListener('dragover', handleDragOver);
dropzone.addEventListener('drop', handleDrop);

function handleDragStart(e) {
    // Prevent dragging until scanner is ready
    if (!scannerReady) {
        e.preventDefault();
        // brief visual cue
        this.classList.add('disabled-drag');
        setTimeout(() => this.classList.remove('disabled-drag'), 600);
        return;
    }

    // mark dragging and pause global star animation immediately so the UI
    // quiets while the user drags and the scan starts
    isDragging = true;
    try { if (window.stars && typeof window.stars.pause === 'function') window.stars.pause(); } catch(_){ }

    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.dataset.file);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    isDragging = false;
    // If the drag ended without a successful drop, resume stars
    // If a drop happened, processFile() will resume when finished.
    if (!isDropped) {
        try { if (window.stars && typeof window.stars.resume === 'function') window.stars.resume(); } catch(_){ }
    }
}

function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    this.classList.remove('dragover');
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleDrop(e) {
    e.preventDefault();
    this.classList.remove('dragover');
    isDropped = true;
    
    const fileName = e.dataTransfer.getData('text/plain');
    if (fileName) {
        // If a different source is already dropped, reset (move it back)
        if (currentDroppedSource && currentDroppedSource.dataset.file !== fileName) {
            // move previous back into sources container
            sourcesContainer.appendChild(currentDroppedSource);
            currentDroppedSource.classList.remove('dropped');
            currentDroppedSource.draggable = !!scannerReady;
            currentDroppedSource = null;
            // show the dropzone CTA again
            const dzInner = dropzone.querySelector('.dz-inner');
            if (dzInner) dzInner.style.display = '';
        }

        // Find the source element (if it exists in the page)
        const srcElem = Array.from(document.querySelectorAll('.source')).find(s => s.dataset.file === fileName);
        if (srcElem) {
            // move it to dropzone and mark currentDroppedSource
            const dzInner = dropzone.querySelector('.dz-inner');
            if (dzInner) dzInner.style.display = 'none';
            srcElem.classList.add('dropped');
            srcElem.draggable = false;
            dropzone.appendChild(srcElem);
            currentDroppedSource = srcElem;
        }

        // allow progress bar to fill now that the user has provided data
        allowProgressFill = true;

        // start processing the file (this function will keep stars paused while
        // the scan is running and resume afterwards)
        processFile(fileName).finally(() => {
            // ensure we clear the dropped flag after processing finishes so
            // subsequent drag/dragend events behave correctly
            isDropped = false;
        });
    }
}

async function processFile(fileName) {
    // Show scanning status
    // Pause star animation while processing
    try { if (window.stars && typeof window.stars.pause === 'function') window.stars.pause(); } catch(_){ }

    // add a visual scanning indicator to the dropped source (if any)
    try {
        if (currentDroppedSource && !currentDroppedSource.classList.contains('scanning')) {
            currentDroppedSource.classList.add('scanning');
        }
    } catch (_){ }

    if (scanStatus) scanStatus.hidden = false;
    // results.hidden = true;
    updateProgress('Analyzing file...', 50);

    try {
        const response = await fetch(`${BACKEND_URL}/process-file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileName: fileName })
        });

        const data = await response.json();
        console.log(data);
        if (response.ok) {
            // Show results
            updateProgress('Analysis complete', 100);
            setTimeout(() => {
                showResults(data, fileName);
                // remove scanning visual
                try { if (currentDroppedSource) currentDroppedSource.classList.remove('scanning'); } catch(_){ }
                try { if (window.stars && typeof window.stars.resume === 'function') window.stars.resume(); } catch(_){ }
            }, 500);
        } else {
            throw new Error(data.error || 'Failed to process file');
        }
    } catch (error) {
        console.error('Error:', error);
        updateProgress('Error: ' + error.message, 0);
        // remove scanning visual on error
        try { if (currentDroppedSource) currentDroppedSource.classList.remove('scanning'); } catch(_){ }
        try { if (window.stars && typeof window.stars.resume === 'function') window.stars.resume(); } catch(_){ }
    }
}

async function processSelectedFile() {
    const fileSelect = document.getElementById('file-select');
    const selectedFile = fileSelect.value;
    
    if (!selectedFile) {
        alert('Please select a file first');
        return;
    }

    // allow the progress bar to fill because the user selected a file
    allowProgressFill = true;

    // Show scanning status
    try { if (window.stars && typeof window.stars.pause === 'function') window.stars.pause(); } catch(_){}

    if (scanStatus) scanStatus.hidden = false;
    if (results) results.hidden = true;
    updateProgress('Analyzing file...', 50);

    try {
        const response = await fetch(`${BACKEND_URL}/process-file`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ fileName: selectedFile })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Show results
            updateProgress('Analysis complete', 100);
            setTimeout(() => {
                showResults(data, selectedFile);
                try { if (window.stars && typeof window.stars.resume === 'function') window.stars.resume(); } catch(_){}
            }, 500);
        } else {
            throw new Error(data.error || 'Failed to process file');
        }
    } catch (error) {
        console.error('Error:', error);
        updateProgress('Error: ' + error.message, 0);
        try { if (window.stars && typeof window.stars.resume === 'function') window.stars.resume(); } catch(_){}
    }
}

function updateProgress(message, percent) {
    const progressBar = document.querySelector('.progress .bar');
    const statusText = document.querySelector('.status-text');
    
    // Only change the visual fill of the progress bar if the DOM contains
    // a progress bar element (user removed it) and the user has provided
    // data (dropped or selected). For initialization messages prior to
    // user action, keep the bar visually empty while still updating the
    // status text.
    if (progressBar) {
        if (allowProgressFill) {
            progressBar.style.width = `${percent}%`;
        } else {
            // keep the bar empty until a source/file is added
            progressBar.style.width = `0%`;
        }
    }
    if (statusText) statusText.textContent = message;
}

function showResults(data, fileName) {
    if (scanStatus) scanStatus.hidden = true;
    
    const modal = document.getElementById('resultModal');
    const resultIcon = modal.querySelector('.result-icon');
    const resultTitle = modal.querySelector('.result-title');
    const resultMessage = modal.querySelector('.result-message');
    const resultDetails = modal.querySelector('.result-details');
    
    // Set content based on result
    if (data.anomalyFound) {
        resultIcon.innerHTML = '⚠️';
        resultTitle.innerHTML = 'Anomaly Detected!';
        resultTitle.style.color = '#dc3545';
        resultMessage.innerHTML = 'Potential network intrusion detected in the analyzed traffic.';
    } else {
        resultIcon.innerHTML = '✅';
        resultTitle.innerHTML = 'No Anomaly Found';
        resultTitle.style.color = '#28a745';
        resultMessage.innerHTML = 'The analyzed traffic appears to be normal.';
    }

    // Helper to extract detection and confidence from different response shapes
    function extractDetectionInfo(resp) {
        // resp may be: { details: { prediction, confidence, is_attack } }
        // or { prediction, confidence, is_attack } or missing
        let det = null;
        if (!resp) return null;
        if (resp.details && typeof resp.details === 'object') det = resp.details;
        else det = resp;
        const prediction = det && (det.prediction || det.prediction === 0) ? det.prediction : null;
        const confidence = det && (det.confidence || det.confidence === 0) ? det.confidence : null;
        const is_attack = det && (typeof det.is_attack !== 'undefined') ? det.is_attack : null;
        return { prediction, confidence, is_attack };
    }

    const info = extractDetectionInfo(data);

    // Format detection type nicely
    function friendlyPrediction(pred) {
        if (!pred && pred !== 0) return 'N/A';
        const p = String(pred).toLowerCase();
        if (p.includes('attack') || p.includes('att') || p === '1') return 'Attack';
        if (p.includes('normal') || p === '0') return 'Normal';
        return String(pred);
    }

    // Format confidence: if value looks like fraction (<=1) convert to percent
    function formatConfidence(c) {
        if (c === null || typeof c === 'undefined') return 'N/A';
        let num = Number(c);
        if (isNaN(num)) return 'N/A';
        if (num <= 1) num = num * 100; // assume fraction
        return `${num.toFixed(2)}%`;
    }

    // Add detailed information
    let detailsHtml = `\n        <p><strong>File Analyzed:</strong> ${fileName}</p>\n        <p><strong>Analysis Status:</strong> ${data.status}</p>\n    `;
    if (info && (info.prediction || info.confidence || info.is_attack !== null)) {
        detailsHtml += `\n            <p><strong>Detection Type:</strong> ${friendlyPrediction(info.prediction)}</p>\n            <p><strong>Confidence:</strong> ${formatConfidence(info.confidence)}</p>\n        `;
    } else {
        // Provide guidance when no detection info available
        detailsHtml += `\n            <p><em>No per-record detection or confidence available for this file.</em></p>\n            <p>If you expect detection and confidence, submit a JSON feature payload or enable dataset parsing on the server.</p>\n        `;
    }
    resultDetails.innerHTML = detailsHtml;
    // Add download link for results.txt (if available on the server)
    const downloadWrapper = document.createElement('div');
    downloadWrapper.style.marginTop = '1rem';
    const downloadLink = document.createElement('a');
    downloadLink.href = `${BACKEND_URL}/results-file`;
    downloadLink.className = 'btn btn-primary';
    downloadLink.textContent = 'Download results.txt';
    downloadLink.style.display = 'inline-block';
    downloadLink.style.padding = '0.5rem 1rem';
    downloadLink.style.borderRadius = '6px';
    downloadLink.style.background = '#007bff';
    downloadLink.style.color = '#fff';
    downloadLink.style.textDecoration = 'none';
    downloadLink.target = '_blank';
    downloadWrapper.appendChild(downloadLink);
    resultDetails.appendChild(downloadWrapper);
    
    // Show modal with animation
    modal.hidden = false;
    setTimeout(() => modal.classList.add('show'), 10);
    
    // Setup close button
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.onclick = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.hidden = true, 300);
    };
    
    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) {
            closeBtn.onclick();
        }
    };
}

// Helper: Try to extract a friendly label for each source by fetching the file and
// reading a short summary (first non-empty line) from a relative data/ path.
async function setLabelsFromFiles() {
    const all = Array.from(document.querySelectorAll('.source'));
    for (const s of all) {
        const file = s.dataset.file;
        try {
            const resp = await fetch(`data/${file}`);
            if (!resp.ok) continue;
            const txt = await resp.text();
            const first = txt.split(/\r?\n/).find(l => l && l.trim().length > 0);
            if (first) {
                const label = first.length > 40 ? first.slice(0,40) + '…' : first;
                const labelEl = s.querySelector('.label');
                if (labelEl) labelEl.textContent = label;
            }
        } catch (e) {
            // ignore
        }
    }
}

// Initialize scanner readiness: probe backend /status, otherwise fallback to short timeout
async function initializeScannerReady() {
    // show a centered status inside the dropzone while probing the backend
    if (scanStatus) scanStatus.hidden = false;
    updateProgress('Initializing scanner...', 0);
    try {
        const resp = await fetch(`${BACKEND_URL}/status`);
        const data = await resp.json();
        if (data && data.ready) scannerReady = true;
        else scannerReady = true; // if server responds but not explicit, still enable
    } catch (e) {
        // backend not available — fallback to enabling after brief delay
        await new Promise(r => setTimeout(r, 800));
        scannerReady = true;
    }
    // reflect state: update the dropzone CTA to indicate scanner readiness
    try {
        const dzCta = document.querySelector('.dz-cta');
        // preserve original CTA text for possible future use
        if (dzCta && !dzCta.dataset.origText) dzCta.dataset.origText = dzCta.textContent || '';
        if (dzCta) {
            dzCta.textContent = 'Ready — drop data to scan';
            dzCta.classList.add('ready');
        }
    } catch (_){ }
    // hide the centered scanStatus (we replaced CTA text)
    setTimeout(() => { if (scanStatus) scanStatus.hidden = true; }, 800);
    wireSourceEvents();
    // set friendly labels
    setLabelsFromFiles();
}

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    initializeScannerReady();
});

// Handle drag and drop functionality
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

// Add some basic CSS
const style = document.createElement('style');
style.textContent = `
    .dropzone {
        border: 3px dashed rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        transition: all 0.3s ease;
        background: rgba(255, 255, 255, 0.05);
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .dropzone.dragover {
        border-color: rgba(255, 255, 255, 0.5);
        background: rgba(255, 255, 255, 0.1);
        transform: scale(1.02);
    }
    
    .dz-cta {
        font-size: 1.2rem;
        color: rgba(255, 255, 255, 0.8);
    }
    
    /* progress bar removed - controlled by JS and UI; kept out of injected styles */
    
    .alert {
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
    }
    
    .alert-danger {
        background-color: rgba(220, 53, 69, 0.2);
        color: #dc3545;
        border: 1px solid rgba(220, 53, 69, 0.3);
    }
    
    .alert-success {
        background-color: rgba(40, 167, 69, 0.2);
        color: #28a745;
        border: 1px solid rgba(40, 167, 69, 0.3);
    }
    
    /* progress bar removed - keep UI minimal */
    
    .alert {
        padding: 10px;
        border-radius: 4px;
        margin: 10px 0;
    }
    
    .alert-danger {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }
    
    .alert-success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }
`;
document.head.appendChild(style);

// Additional UI rules for sources centering, hiding filenames, and dropped state
const style2 = document.createElement('style');
style2.textContent = `
    /* Center the data sources and hide raw file names (preserve in DOM for accessibility) */
    .dnd-sources {
        display: flex;
        gap: 1rem;
        justify-content: center;
        align-items: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
    }

    .source {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 0.8rem 1rem;
        border-radius: 10px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.04);
        min-width: 160px;
        cursor: grab;
        transition: transform 0.12s ease, box-shadow 0.12s ease;
    }

    .source:active { cursor: grabbing; }
    .source .label { font-size: 0.95rem; text-align: center; }
    /* increase icon size to match main stylesheet */
    .source .icon { font-size: 3.2rem; margin-bottom: 0.3rem; }

    .source.dropped { box-shadow: 0 8px 18px rgba(0,0,0,0.4); transform: translateY(-4px); }
    .source.disabled-drag { opacity: 0.5; transform: scale(0.98); }
`;
document.head.appendChild(style2);
