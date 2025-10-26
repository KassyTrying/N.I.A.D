// intrusion-chat.js
// Auto-generate prompt buttons and simulate basic chat interaction
(function () {
  const prompts = [
    { id: 'p1', label: 'What is an intrusion?', text: 'Explain what a network intrusion is.' },
    { id: 'p2', label: 'Common signs', text: 'What are common signs of an intrusion?' },
    { id: 'p3', label: 'Prevention tips', text: 'How can I prevent intrusions on my network?' }
  ];

  function createPromptButton(item) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'prompt-btn prompt';
    btn.textContent = item.label;
    btn.title = item.text;
    btn.setAttribute('data-prompt-id', item.id);
    btn.setAttribute('aria-label', item.label + ': ' + item.text);
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
          // A simple simulated reply — replace with real API call later
          bubble.textContent = simulateReply(item);
        }
      }
      scrollChatToBottom();
    }, 900 + Math.random() * 800);
  }

  function simulateReply(item) {
    switch (item.id) {
      case 'p1':
        return 'A network intrusion is an unauthorized activity that attempts to compromise the confidentiality, integrity, or availability of networked resources.';
      case 'p2':
        return 'Common signs include unusual outbound traffic, unexpected open ports, repeated failed logins, sudden performance drops, and alerts from IDS/IPS systems.';
      case 'p3':
        return 'Preventive steps: keep systems patched, use network segmentation, enforce least privilege, monitor logs, use IDS/IPS, and apply strong authentication.';
      default:
        return 'Sorry, I don\'t have a ready response for that prompt.';
    }
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

  document.addEventListener('DOMContentLoaded', () => {
    renderPrompts();
  });
})();