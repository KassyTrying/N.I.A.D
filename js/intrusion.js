// js/intrusion.js
const BACKEND_URL = 'http://localhost:5000';

async function fetchAvailableFiles(){
  const sel = document.getElementById('file-select');
  if(!sel) return;
  sel.innerHTML = '<option value="">(loading...)</option>';
  try{
    const res = await fetch(`${BACKEND_URL}/available-files`);
    const j = await res.json();
    sel.innerHTML = '';
    if(res.ok && Array.isArray(j.files)){
      j.files.forEach(f => {
        const o = document.createElement('option'); o.value = f; o.textContent = f; sel.appendChild(o);
      });
      if(j.files.length===0) sel.innerHTML = '<option value="">(no files)</option>';
    } else {
      sel.innerHTML = '<option value="">(error)</option>';
      showResult('Error fetching files: ' + (j.error||JSON.stringify(j)));
    }
  }catch(e){
    sel.innerHTML = '<option value="">(error)</option>';
    showResult('Network error fetching files: '+e.message);
  }
}

async function fetchModelInfo(){
  try{
    const res = await fetch(`${BACKEND_URL}/model-info`);
    const j = await res.json();
    if(res.ok){
      showResult('Model info:\n' + JSON.stringify(j, null, 2));
    } else {
      showResult('Error model-info: ' + (j.error||JSON.stringify(j)));
    }
  }catch(e){
    showResult('Network error model-info: '+e.message);
  }
}

async function analyzeSelectedFile(){
  const sel = document.getElementById('file-select');
  const file = sel ? sel.value : null;
  if(!file){ alert('Please select a file'); return; }
  setResult('Analyzing ' + file + ' ...');
  try{
    const res = await fetch(`${BACKEND_URL}/process-file`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({fileName: file})
    });
    const j = await res.json();
    if(res.ok){
      setResult('Analysis result:\n' + JSON.stringify(j, null, 2));
    } else {
      setResult('Error running analysis: ' + (j.error||JSON.stringify(j)));
    }
  }catch(e){
    setResult('Network error running analysis: '+e.message);
  }
}

function showResult(text){
  const r = document.getElementById('result');
  if(r) r.textContent = text;
}
function setResult(text){ showResult(text); }

// Wire up UI
document.addEventListener('DOMContentLoaded', ()=>{
  const analyzeBtn = document.getElementById('analyze-btn');
  const refreshBtn = document.getElementById('refresh-btn');
  const modelInfoBtn = document.getElementById('model-info-btn');
  if(analyzeBtn) analyzeBtn.addEventListener('click', analyzeSelectedFile);
  if(refreshBtn) refreshBtn.addEventListener('click', fetchAvailableFiles);
  if(modelInfoBtn) modelInfoBtn.addEventListener('click', fetchModelInfo);
  fetchAvailableFiles();
});
