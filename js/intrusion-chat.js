// js/intrusion-chat.js
// Handles chat UI for intrusion.html

const intrusionPrompts = [
	"What is intrusion detection?",
	"Show me recent intrusions.",
	"How does the system detect intrusions?",
	"Give me an example of a detected intrusion.",
	"What types of attacks are monitored?"
];

function renderIntrusionPrompts() {
	const promptBar = document.getElementById('prompt-bar');
	// only show first three prompts, keep original indexes via map
	promptBar.innerHTML = intrusionPrompts.map((p, i) => ({p,i})).slice(0,3).map(
		({p,i}) => `<button class="prompt-btn" data-idx="${i}">${p}</button>`
	).join('');

	// delegate clicks
	promptBar.addEventListener('click', (e) => {
		const btn = e.target.closest('.prompt-btn');
		if (!btn) return;
		const idx = Number(btn.dataset.idx);
		// directly send prompt as user message (prompts-only flow)
		handlePromptClick(idx);
	});
}

function appendMessage({role='bot', text='', loading=false}){
	const chat = document.getElementById('chat');
	const msg = document.createElement('div');
	msg.className = `msg ${role}` + (loading? ' loading':'');
	const avatar = document.createElement('div');
	avatar.className = 'avatar';
	if(role==='bot'){
		avatar.style.background = 'linear-gradient(90deg,#ffb380,#ffd6a0)';
	} else {
		avatar.style.background = 'linear-gradient(90deg,#7efcf6,#4ad5ff)';
	}
	const bubble = document.createElement('div');
	bubble.className = 'bubble';
	bubble.innerHTML = text;
	msg.appendChild(avatar);
	msg.appendChild(bubble);
	chat.appendChild(msg);
	chat.scrollTop = chat.scrollHeight;
	return msg;
}

function handlePromptClick(idx){
	const promptText = intrusionPrompts[idx];
	appendMessage({role:'user', text: escapeHtml(promptText)});
	// hide prompt bar after a choice
	const promptBar = document.getElementById('prompt-bar');
	if(promptBar){
		promptBar.classList.add('hidden');
	}
	// show bot typing indicator
	const loadingMsg = appendMessage({role:'bot', text: '...', loading:true});
	// simulated answer
	setTimeout(() => {
		if(loadingMsg){
			loadingMsg.querySelector('.bubble').innerHTML = `<b>Sample answer:</b> [Filtered data will appear here after backend integration]`;
			loadingMsg.classList.remove('loading');
		}
	}, 900 + Math.random()*900);
}

function escapeHtml(str){
	return String(str).replace(/[&<>"']/g, function(s){
		return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[s];
	});
}

function resizeTextarea(el){
	el.style.height = 'auto';
	el.style.height = Math.min(200, el.scrollHeight) + 'px';
}

document.addEventListener('DOMContentLoaded', () => {
	renderIntrusionPrompts();
});

