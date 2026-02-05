(() => {
  const modal = document.getElementById('ai-tutor-modal');
  const openBtn = document.querySelector('.floating-ai');
  const closeBtn = modal?.querySelector('.ai-close');
  const chatLog = document.getElementById('ai-chat-log');
  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');
  const clearBtn = modal?.querySelector('.ai-clear');
  const webToggle = document.getElementById('ai-web-toggle');
  const chips = modal?.querySelectorAll('.ai-chip') || [];

  if (!modal || !openBtn || !chatLog || !form || !input) return;

  const STORAGE_KEY = 'classdoodle_ai_history';
  let messages = [];

  const persist = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
  };

  const restore = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        messages = JSON.parse(saved);
        messages.forEach(msg => appendMessage(msg.role, msg.content));
      } catch {
        messages = [];
      }
    }

    if (messages.length === 0) {
      appendMessage('system', 'Hi! I am your ClassDoodle AI tutor. Ask anything about your subjects, and I will explain step by step.');
    }
  };

  const toggleModal = (open) => {
    modal.classList.toggle('open', open);
    modal.setAttribute('aria-hidden', String(!open));
    if (open) {
      input.focus();
      chatLog.scrollTop = chatLog.scrollHeight;
    }
  };

  const appendMessage = (role, content) => {
    const wrapper = document.createElement('div');
    wrapper.className = `ai-message ${role}`;

    const roleLabel = document.createElement('div');
    roleLabel.className = 'ai-role';
    roleLabel.textContent = role === 'assistant' ? 'Tutor' : role === 'user' ? 'You' : 'Note';

    const bubble = document.createElement('div');
    bubble.className = 'ai-bubble';
    bubble.textContent = content;

    wrapper.append(roleLabel, bubble);
    chatLog.appendChild(wrapper);
    chatLog.scrollTop = chatLog.scrollHeight;
  };

  const getPageContext = () => {
    return {
      title: document.title,
      path: window.location.pathname,
      description: document.querySelector('meta[name="description"]')?.content || ''
    };
  };

  const sendMessage = async (text) => {
    const endpoint = form.dataset.endpoint || '/api/tutor';
    const payload = {
      messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
      userMessage: text,
      allowWeb: Boolean(webToggle?.checked),
      context: getPageContext()
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      const reply = data?.reply || 'I could not generate a response right now.';
      messages.push({ role: 'assistant', content: reply });
      appendMessage('assistant', reply);
      persist();
    } catch (error) {
      const fallback = 'I am offline right now. Please try again later or check your internet connection.';
      appendMessage('system', fallback);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    input.value = '';
    const sendBtn = form.querySelector('.ai-send');
    if (sendBtn) sendBtn.disabled = true;

    messages.push({ role: 'user', content: text });
    appendMessage('user', text);
    persist();

    await sendMessage(text);
    if (sendBtn) sendBtn.disabled = false;
  };

  openBtn.addEventListener('click', () => toggleModal(true));
  closeBtn?.addEventListener('click', () => toggleModal(false));

  modal.addEventListener('click', (event) => {
    if (event.target === modal) toggleModal(false);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('open')) {
      toggleModal(false);
    }
  });

  form.addEventListener('submit', handleSubmit);

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  clearBtn?.addEventListener('click', () => {
    messages = [];
    localStorage.removeItem(STORAGE_KEY);
    chatLog.innerHTML = '';
    appendMessage('system', 'New chat started. Ask your question!');
  });

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      const prompt = chip.dataset.prompt || chip.textContent;
      input.value = prompt;
      input.focus();
    });
  });

  restore();
})();
