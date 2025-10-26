// js/live-monitor.js
// Live network monitoring UI with filler data

(function(){
  let isScanning = false;

  function initMonitor(){
    const scanBtn = document.getElementById('scan-btn');
    const scanningStatus = document.getElementById('scanning-status');
    const scanReport = document.getElementById('scan-report');
    const scanProgress = document.getElementById('scan-progress');
    const scanStatusText = document.getElementById('scan-status-text');

    if (!scanBtn) return;

    scanBtn.addEventListener('click', startScan);
  }

  function startScan(){
    if (isScanning) return;
    isScanning = true;

    const scanBtn = document.getElementById('scan-btn');
    const scanningStatus = document.getElementById('scanning-status');
    const scanReport = document.getElementById('scan-report');
    const scanProgress = document.getElementById('scan-progress');
    const scanStatusText = document.getElementById('scan-status-text');

    // Pause stars and disable button
    pauseStars(true);
    scanBtn.disabled = true;
    scanBtn.textContent = 'Scanning...';

    // Show scanning UI
    if (scanReport) scanReport.hidden = true;
    if (scanningStatus) scanningStatus.hidden = false;
    if (scanProgress) scanProgress.style.width = '0%';

    // Simulate scan progress
    let progress = 0;
    const stages = [
      { threshold: 20, text: 'Discovering devices...' },
      { threshold: 40, text: 'Analyzing traffic patterns...' },
      { threshold: 60, text: 'Checking for anomalies...' },
      { threshold: 80, text: 'Running intrusion detection...' },
      { threshold: 95, text: 'Finalizing report...' }
    ];

    const interval = setInterval(() => {
      progress += Math.floor(3 + Math.random() * 8);
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        completeScan();
      } else {
        // Update status text based on progress
        for (let stage of stages) {
          if (scanStatusText && progress >= stage.threshold - 10 && progress < stage.threshold + 5) {
            scanStatusText.textContent = stage.text;
            break;
          }
        }
      }
      
      if (scanProgress) scanProgress.style.width = progress + '%';
    }, 150);
  }

  function completeScan(){
    const scanBtn = document.getElementById('scan-btn');
    const scanningStatus = document.getElementById('scanning-status');
    const scanReport = document.getElementById('scan-report');
    const scanTime = document.getElementById('scan-time');
    const reportSummary = document.getElementById('report-summary');

    // Generate random scan outcome (90% safe, 10% threats for variety)
    const hasThreat = Math.random() < 0.1;
    
    setTimeout(() => {
      if (scanningStatus) scanningStatus.hidden = true;
      if (scanReport) scanReport.hidden = false;

      // Update report time
      const now = new Date();
      if (scanTime) scanTime.textContent = now.toLocaleTimeString();

      // Update report summary
      if (reportSummary) {
        if (hasThreat) {
          reportSummary.innerHTML = '<span class="summary-icon warning">⚠️</span><span class="summary-text">Potential threats detected</span>';
        } else {
          reportSummary.innerHTML = '<span class="summary-icon">✅</span><span class="summary-text">No threats detected</span>';
        }
      }

      // Fill report details
      try { if (hasThreat) updateThreatReport(); else updateSafeReport(); } catch(_){ }

      // Regenerate stars around expanded card
      try { if (typeof createStars === 'function') createStars(); } catch(_){ }
      
      // Resume stars and re-enable button
      pauseStars(false);
      isScanning = false;
      if (scanBtn) {
        scanBtn.disabled = false;
        scanBtn.innerHTML = '<span class="btn-icon">🔍</span>Start Network Scan';
      }
    }, 400);
  }

  function updateSafeReport(){
    const anomalyList = document.getElementById('anomaly-list');
    const intrusionList = document.getElementById('intrusion-list');
    const devicesCount = document.getElementById('devices-count');
    const packetsCount = document.getElementById('packets-count');
    const scanDuration = document.getElementById('scan-duration');

    if (anomalyList) anomalyList.innerHTML = `
      <li>✓ Traffic patterns: Normal</li>
      <li>✓ Bandwidth usage: Within expected range</li>
      <li>✓ Connection behavior: No anomalies detected</li>
    `;

    if (intrusionList) intrusionList.innerHTML = `
      <li>✓ Port scans: None detected</li>
      <li>✓ Unauthorized access attempts: 0</li>
      <li>✓ Malicious signatures: None found</li>
    `;

    if (devicesCount) devicesCount.textContent = Math.floor(8 + Math.random() * 10);
    if (packetsCount) packetsCount.textContent = (Math.floor(30000 + Math.random() * 50000)).toLocaleString();
    if (scanDuration) scanDuration.textContent = (6 + Math.random() * 4).toFixed(1) + 's';
  }

  function updateThreatReport(){
    const anomalyList = document.getElementById('anomaly-list');
    const intrusionList = document.getElementById('intrusion-list');
    const devicesCount = document.getElementById('devices-count');
    const packetsCount = document.getElementById('packets-count');
    const scanDuration = document.getElementById('scan-duration');

    const threats = [
      { type: 'anomaly', text: '⚠️ Unusual traffic spike detected at 192.168.1.23' },
      { type: 'anomaly', text: '⚠️ Bandwidth usage exceeds normal baseline by 45%' },
      { type: 'intrusion', text: '⚠️ Suspicious port scan detected from 192.168.1.89' },
      { type: 'intrusion', text: '⚠️ 3 failed authentication attempts from unknown device' }
    ];

    const selectedThreats = threats.sort(() => 0.5 - Math.random()).slice(0, 2);
    
    const anomalyThreats = selectedThreats.filter(t => t.type === 'anomaly');
    const intrusionThreats = selectedThreats.filter(t => t.type === 'intrusion');

    if (anomalyList) anomalyList.innerHTML = anomalyThreats.length > 0 
      ? anomalyThreats.map(t => `<li>${t.text}</li>`).join('')
      : '<li>✓ No anomalies detected</li>';

    if (intrusionList) intrusionList.innerHTML = intrusionThreats.length > 0
      ? intrusionThreats.map(t => `<li>${t.text}</li>`).join('')
      : '<li>✓ No intrusions detected</li>';

    if (devicesCount) devicesCount.textContent = Math.floor(8 + Math.random() * 10);
    if (packetsCount) packetsCount.textContent = (Math.floor(30000 + Math.random() * 50000)).toLocaleString();
    if (scanDuration) scanDuration.textContent = (6 + Math.random() * 4).toFixed(1) + 's';
  }

  function pauseStars(flag){
    const cls = 'pause-stars';
    const b = document.body;
    if (!b) return;
    if (flag) b.classList.add(cls); else b.classList.remove(cls);
  }

  document.addEventListener('DOMContentLoaded', initMonitor);
})();
