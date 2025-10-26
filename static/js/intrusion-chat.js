// intrusion-chat.js
// Auto-generate prompt buttons and simulate basic chat interaction
(function () {
  const prompts = [
    { id: 'p1', label: 'Give packet-level details on malicious behavior', text: 'Give packet-level details on malicious behavior?' },
    { id: 'p2', label: 'Tell me how to chase this bandit off my network', text: 'Tell me how to chase this bandit off my network?' },
    { id: 'p3', label: 'What features influence the anomaly score', text: 'What features influence the anomaly score?' }
  ];

  // Hard-coded multiple possible replies per prompt id. simulateReply will pick one at random.
  const replies = {
    p1: [
      'A network intrusion is an unauthorized activity that attempts to compromise the confidentiality, integrity, or availability of networked resources.',
      'Intrusions often use packet-level techniques like spoofing, malformed packets, anomalous TCP flags, or protocol misuse to bypass defenses.',
      'At the packet level you may see abnormal payloads, large numbers of SYN packets, odd header values, or frequent retransmissions indicating scanning or attacks.'
    ],
    p2: [
      'Common signs include unusual outbound traffic, unexpected open ports, repeated failed logins, sudden performance drops, and alerts from IDS/IPS systems.',
      'Look for persistent connections to unknown IPs, spikes in CPU/network usage, unexplained changes to firewall rules, and unknown processes running on hosts.',
      'Use log correlation to find repeated patterns: many failed authentications, repeated access to uncommon services, or new services listening on high ports.'
    ],
    p3: [
      'Preventive steps: keep systems patched, use network segmentation, enforce least privilege, monitor logs, use IDS/IPS, and apply strong authentication.',
      'Improve telemetry: centralize logs, enable flow records, use anomaly detection, and run regular vulnerability scans and incident response drills.',
      'Design defense in depth: endpoint protection, secure configurations, timely patching, MFA for access, and network controls like micro-segmentation.'
    ]
  };

  function createPromptButton(item) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'prompt-btn prompt';
    btn.textContent = item.label;
    btn.title = item.text;
    btn.setAttribute('data-prompt-id', item.id);
    btn.setAttribute('aria-label', item.label + ': ' + item.text);
    // When clicked, send the prompt immediately. The button size is adjusted via CSS
    btn.addEventListener('click', () => sendPrompt(item));
    return btn;
  }

  function appendMessage({ role = 'bot', text = '', loading = false } = {}) {
    const chat = document.getElementById('chat');
    if (!chat) return;

    const msg = document.createElement('div');
    msg.className = 'msg ' + (role === 'user' ? 'user' : 'bot');

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = role === 'user' ? '👤' : '🤖';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;

    msg.appendChild(avatar);
    msg.appendChild(bubble);

    if (loading) msg.classList.add('loading');

    chat.appendChild(msg);
    scrollChatToBottom();
    return msg;
  }

  function scrollChatToBottom() {
    const chat = document.getElementById('chat');
    if (!chat) return;
    // small timeout to allow layout/render
    setTimeout(() => {
      chat.scrollTop = chat.scrollHeight;
    }, 40);
  }

  function sendPrompt(item) {
    // Add user message
    appendMessage({ role: 'user', text: item.text });

    // Add bot loading message
    const loadingMsg = appendMessage({ role: 'bot', text: 'Thinking…', loading: true });

    // Simulate async response
    setTimeout(() => {
      if (loadingMsg) {
        loadingMsg.classList.remove('loading');
        const bubble = loadingMsg.querySelector('.bubble');
        if (bubble) {
          // A simple simulated reply — choose one of the hard-coded replies at random
          bubble.textContent = simulateReply(item);
        }
      }
      scrollChatToBottom();
    }, 900 + Math.random() * 800);
  }

  function simulateReply(item) {
    const list = (item && replies[item.id]) ? replies[item.id] : null;
    if (Array.isArray(list) && list.length) {
      return list[Math.floor(Math.random() * list.length)];
    }
    return 'Sorry, I don\'t have a ready response for that prompt.';
  }

  function renderPrompts() {
    const bar = document.getElementById('prompt-bar');
    if (!bar) return;
    // Clear any existing content
    bar.innerHTML = '';
    prompts.forEach((p) => {
      const btn = createPromptButton(p);
      bar.appendChild(btn);
    });
  }

  // Remove any chart/panel elements so the UI shows only the chat + auto prompts
  function removeChartBox() {
    const selectors = [
      '#chart', '#chart-box', '.chart', '.chart-box', '.chart-container', '.panel', '.card-extra'
    ];
    selectors.forEach(s => {
      document.querySelectorAll(s).forEach(el => el.remove());
    });

    // Remove two-column layout if present on the main card
    const mainCard = document.querySelector('main.card');
    if (mainCard && mainCard.classList.contains('with-panel')) {
      mainCard.classList.remove('with-panel');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Clean up any chart or right-hand panel before rendering prompts
    try { removeChartBox(); } catch (e) { /* ignore DOM cleanup errors */ }
    renderPrompts();
  });
})();