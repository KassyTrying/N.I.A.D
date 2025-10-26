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
    if (fileName) {
        processFile(fileName);
    }
}

async function processFile(fileName) {
    // Show scanning status
    // Pause star animation while processing
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
            body: JSON.stringify({ fileName: fileName })
        });

        const data = await response.json();
        
        if (response.ok) {
            // Show results
            updateProgress('Analysis complete', 100);
            setTimeout(() => {
                showResults(data, fileName);
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
    
    // Add detailed information
    resultDetails.innerHTML = `
        <p><strong>File Analyzed:</strong> ${fileName}</p>
        <p><strong>Analysis Status:</strong> ${data.status}</p>
        ${data.details ? `
            <p><strong>Detection Type:</strong> ${data.details.prediction}</p>
            <p><strong>Confidence:</strong> ${(data.details.confidence * 100).toFixed(2)}%</p>
        ` : ''}
    `;
    
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
    fetchAvailableFiles();
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
    
    .progress {
        height: 4px;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 2px;
        margin: 10px 0;
        overflow: hidden;
    }
    
    .progress .bar {
        height: 100%;
        background-color: #4CAF50;
        border-radius: 2px;
        transition: width 0.3s ease;
    }
    
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
    
    .progress {
        height: 4px;
        background-color: #f5f5f5;
        border-radius: 2px;
        margin: 10px 0;
    }
    
    .progress .bar {
        height: 100%;
        background-color: #007bff;
        border-radius: 2px;
        transition: width 0.3s ease;
    }
    
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
