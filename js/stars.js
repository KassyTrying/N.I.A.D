// stars.js
// Generate animated stars only around the card (not behind it)

function createStars() {
	const starsContainer = document.querySelector('.stars');
	const card = document.querySelector('.card');
	if (!starsContainer) return;

	// Clear existing stars
	starsContainer.innerHTML = '';

	const vw = window.innerWidth;
	const vh = window.innerHeight;
	const rect = card ? card.getBoundingClientRect() : {left: vw/3, right: 2*vw/3, top: vh/3, bottom: 2*vh/3};

	// Exclusion margin around card for a clean buffer
	const margin = 12;
	const exclude = {
		left: Math.max(0, rect.left - margin),
		right: Math.min(vw, rect.right + margin),
		top: Math.max(0, rect.top - margin),
		bottom: Math.min(vh, rect.bottom + margin)
	};

	// Scale stars roughly by viewport area
	const numStars = Math.min(600, Math.max(200, Math.floor((vw * vh) / 5000)));
	const fragment = document.createDocumentFragment();

	let created = 0, attempts = 0;
	const maxAttempts = numStars * 12;
	while (created < numStars && attempts < maxAttempts) {
		attempts++;
		const x = Math.random() * vw;
		const y = Math.random() * vh;
		// Skip if inside the excluded (card) area
		if (x >= exclude.left && x <= exclude.right && y >= exclude.top && y <= exclude.bottom) continue;

		const star = document.createElement('div');
		star.className = 'star';
		star.style.left = x + 'px';
		star.style.top = y + 'px';

		const size = 1 + Math.random() * 2.5;
		star.style.width = size + 'px';
		star.style.height = size + 'px';
		star.style.setProperty('--twinkle-opacity', (0.6 + Math.random() * 0.4).toFixed(2));
		star.style.setProperty('--twinkle-duration', (2 + Math.random() * 4).toFixed(2) + 's');
		star.style.setProperty('--twinkle-delay', (Math.random() * -6).toFixed(2) + 's');

		fragment.appendChild(star);
		created++;
	}
	starsContainer.appendChild(fragment);
}

function debounce(fn, wait){
	let t; return (...args)=>{ clearTimeout(t); t = setTimeout(()=>fn(...args), wait); };
}

window.addEventListener('DOMContentLoaded', createStars);
window.addEventListener('resize', debounce(createStars, 150));

