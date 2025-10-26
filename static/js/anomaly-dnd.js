// Constants
const BACKEND_URL = 'http://localhost:5000';
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const scanStatus = document.querySelector('.scan-status');
const results = document.querySelector('.results');
const sources = document.querySelectorAll('.source');

// Initialize drag and drop functionality
sources.forEach(source => {
    source.addEventListener('dragstart', handleDragStart);
    source.addEventListener('dragend', handleDragEnd);
});

dropzone.addEventListener('dragenter', handleDragEnter);
dropzone.addEventListener('dragleave', handleDragLeave);
dropzone.addEventListener('dragover', handleDragOver);
dropzone.addEventListener('drop', handleDrop);

function handleDragStart(e) {
    this.classList.add('dragging');
    e.dataTransfer.setData('text/plain', this.dataset.file);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
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
    
    const fileName = e.dataTransfer.getData('text/plain');
    console.log('Dropped file:', e);
    if (fileName) {
        processFile(fileName);
    }
}

async function processFile(fileName) {
    // Show scanning status
    // Pause star animation while processing
    try { if (window.stars && typeof window.stars.pause === 'function') window.stars.pause(); } catch(_){}

    scanStatus.hidden = false;
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
             console.log(data);
            updateProgress('Analysis complete', 100);
            setTimeout(() => {
                showResults(data, fileName);
                try { if (window.stars && typeof window.stars.resume === 'function') window.stars.resume(); } catch(_){}
            }, 500);
        } else {
            throw new Error(data.error || 'Failed to process file');
        }
         console.log(data);
    } catch (error) {
        console.error('Error:', error);
        updateProgress('Error: ' + error.message, 0);
        try { if (window.stars && typeof window.stars.resume === 'function') window.stars.resume(); } catch(_){}
    }
}

async function processSelectedFile() {
    const fileSelect = document.getElementById('file-select');
    const selectedFile = fileSelect.value;
    
    if (!selectedFile) {
        alert('Please select a file first');
        return;
    }

    // Show scanning status
    try { if (window.stars && typeof window.stars.pause === 'function') window.stars.pause(); } catch(_){}

    scanStatus.hidden = false;
    results.hidden = true;
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
    
    progressBar.style.width = `${percent}%`;
    statusText.textContent = message;
}


function showResults(data, fileName) {
    scanStatus.hidden = true;
    console.log('Test');
    
    const modal = document.getElementById('resultModal');
    const resultIcon = modal.querySelector('.result-icon');
    console.log('Test');
    const resultTitle = modal.querySelector('.result-title');
    const resultMessage = modal.querySelector('.result-message');
    const resultDetails = modal.querySelector('.result-details');
    console.log('Test');
    
    // Set content based on result
    if (data.anomalyFound) {
        resultIcon.innerHTML = '⚠️';
        console.log('Test');
        resultTitle.innerHTML = 'Anomaly Detected!';
        resultTitle.style.color = '#dc3545';
        resultMessage.innerHTML = 'Potential network intrusion detected in the analyzed traffic.';
    } else {
        resultIcon.innerHTML = '✅';
        resultTitle.innerHTML = 'No Anomaly Found';
        console.log('Test');
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

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
    // fetchAvailableFiles();
});

// Handle drag and drop functionality
dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

// Styles injection removed — CSS should be provided by external stylesheets.
// If you want these specific rules applied via JS, re-add them here or
// import/enable `static/css/anomaly.css` from the HTML head instead.