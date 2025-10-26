 (function(){
    let isScanning = false;
    const dropzone = () => document.getElementById('dropzone');
    const fileInput = () => document.getElementById('file-input');
    const statusEl = () => document.querySelector('.scan-status');
    const barEl = () => document.querySelector('.scan-status .bar');
    const statusText = () => document.querySelector('.scan-status .status-text');
    const resultsEl = () => document.querySelector('.results');
    const resSource = () => document.getElementById('res-source');

    function initSources(){
        document.querySelectorAll('.source').forEach(src => {
            src.addEventListener('dragstart', (e)=>{
                e.dataTransfer.setData('text/plain', src.dataset.type);
                e.dataTransfer.effectAllowed = 'copy';
                src.classList.add('dragging');

                // Ultra-lightweight custom drag image (no layout reads)
                try {
                    const type = src.dataset.type;
                    const label = src.querySelector('.label')?.textContent || type;
                    const icon = iconFor(type);
                    const ghost = getDragGhost();
                    ghost.innerHTML = `<span class="dz-icon">${icon}</span><span class="dz-name">${escapeHtml(label)}</span>`;
                    // fixed size to avoid reflow/measure
                    ghost.style.width = '140px';
                    ghost.style.height = '40px';
                    e.dataTransfer.setDragImage(ghost, 70, 20);
                } catch(_) {/* ignore */}
            });
            src.addEventListener('dragend', ()=> src.classList.remove('dragging'));
        });
    }

    function initDropzone(){
        const dz = dropzone();
        const input = fileInput();

        dz.addEventListener('click', ()=> input.click());
        input.addEventListener('change', (e)=>{
            if(e.target.files && e.target.files[0]){
                const payload = { kind: 'file', name: e.target.files[0].name };
                updateDropzonePreview(payload);
                handleScan(payload);
            }
        });

        ;['dragenter','dragover'].forEach(ev=> dz.addEventListener(ev, (e)=>{
            e.preventDefault();
            e.stopPropagation();
            dz.classList.add('hover');
            if(e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
            if (!isScanning) pauseStars(true);
        }));

        ;['dragleave','drop'].forEach(ev=> dz.addEventListener(ev, (e)=>{
            e.preventDefault();
            e.stopPropagation();
            if(ev === 'dragleave') dz.classList.remove('hover');
            if (ev === 'dragleave' && !isScanning) pauseStars(false);
        }));

        dz.addEventListener('drop', (e)=>{
            dz.classList.remove('hover');
            const text = e.dataTransfer.getData('text/plain');
            const files = e.dataTransfer.files;
            if (text) {
                // Remove the dragged source from the icon list
                const srcEl = document.querySelector(`.source[data-type="${CSS.escape(text)}"]`);
                if (srcEl) srcEl.remove();
                const payload = { kind: 'source', type: text };
                updateDropzonePreview(payload);
                // Let the preview paint before starting scan
                requestAnimationFrame(()=> handleScan(payload));
            } else if (files && files.length) {
                const payload = { kind: 'file', name: files[0].name };
                updateDropzonePreview(payload);
                requestAnimationFrame(()=> handleScan(payload));
            }
        });
    }

    function updateDropzonePreview(payload){
        const dzInner = document.querySelector('.dropzone .dz-inner');
        if(!dzInner) return;
        // Remove any previous chip
        const prev = dzInner.querySelector('.dz-chip');
        if(prev) prev.remove();
        // Hide CTA text if present
        const cta = dzInner.querySelector('.dz-cta');
        if(cta) cta.style.display = 'none';

        const icon = payload.kind === 'file' ? '📄' : iconFor(payload.type);
        const name = payload.kind === 'file' ? payload.name : prettySource(payload.type);

        const chip = document.createElement('div');
        chip.className = 'dz-chip';
        chip.innerHTML = `<span class="dz-icon">${icon}</span><span class="dz-name">${escapeHtml(name)}</span>`;
        dzInner.appendChild(chip);
    }

    function handleScan(payload){
        isScanning = true;
        pauseStars(true);
        // reset UI
        resultsEl().hidden = true;
        statusEl().hidden = false;
        barEl().style.width = '0%';
        statusText().textContent = 'Preparing scan…';

        const displayName = payload.kind === 'file' ? payload.name : prettySource(payload.type);
        resSource().textContent = displayName;

        // fake progress
        let p = 0;
        const timer = setInterval(()=>{
            p += Math.floor(5 + Math.random()*12);
            if(p >= 100){
                p = 100;
                clearInterval(timer);
                statusText().textContent = 'Scan complete';
                setTimeout(()=>{
                    statusEl().hidden = true;
                    resultsEl().hidden = false;
                    // Re-generate stars with the new card size so none sit behind the expanded area
                    try { if (typeof createStars === 'function') createStars(); } catch(_){}}
                , 300);
                isScanning = false;
                pauseStars(false);
            } else if (p > 70) {
                statusText().textContent = 'Running anomaly models…';
            } else if (p > 35) {
                statusText().textContent = 'Parsing dataset…';
            } else {
                statusText().textContent = 'Uploading…';
            }
            barEl().style.width = p + '%';
        }, 180);
    }

    function prettySource(t){
        switch(t){
            case 'http-logs': return 'HTTP Logs';
            case 'system-logs': return 'System Logs';
            case 'pcap': return 'PCAP';
            case 'csv': return 'CSV Dataset';
            default: return t || 'Unknown Source';
        }
    }

    function iconFor(t){
        switch(t){
            case 'http-logs': return '🌐';
            case 'system-logs': return '🖥️';
            case 'pcap': return '📡';
            case 'csv': return '📄';
            default: return '📁';
        }
    }

    function escapeHtml(str){
        return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s]));
    }

    function getDragGhost(){
        let ghost = document.getElementById('drag-ghost');
        if (!ghost){
            ghost = document.createElement('div');
            ghost.id = 'drag-ghost';
            ghost.style.position = 'fixed';
            ghost.style.top = '-9999px';
            ghost.style.left = '-9999px';
            ghost.style.pointerEvents = 'none';
            ghost.style.display = 'inline-flex';
            ghost.style.alignItems = 'center';
            ghost.style.justifyContent = 'center';
            ghost.style.gap = '10px';
            ghost.style.padding = '8px 12px';
            ghost.style.borderRadius = '999px';
            ghost.style.background = 'rgba(0,0,0,0.5)';
            ghost.style.border = '1px solid rgba(255,72,0,0.28)';
            ghost.style.color = '#e6f0ff';
            ghost.style.boxShadow = '0 6px 18px rgba(0,0,0,0.35)';
            document.body.appendChild(ghost);
        }
        return ghost;
    }

    document.addEventListener('DOMContentLoaded', ()=>{
        initSources();
        initDropzone();
        initGlobalDnDGuards();
    });

    function pauseStars(flag){
        const cls = 'pause-stars';
        const b = document.body;
        if (!b) return;
        if (flag) b.classList.add(cls); else b.classList.remove(cls);
    }

    // Prevent browser from navigating away when files are dropped outside our dropzone
    function initGlobalDnDGuards(){
        window.addEventListener('dragover', (e)=>{
            e.preventDefault();
        });
        window.addEventListener('drop', (e)=>{
            const dz = dropzone();
            const isInDropzone = dz && e.target && dz.contains(e.target);
            if (!isInDropzone){
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }
})();
