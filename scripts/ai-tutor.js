(() => {
  const injectAiUi = () => {
    if (document.getElementById('ai-tutor-modal')) return;

    const button = document.createElement('button');
    button.className = 'floating-ai';
    button.textContent = '🤖 Ask ClassDoodle AI';
    document.body.appendChild(button);

    const modal = document.createElement('div');
    modal.id = 'ai-tutor-modal';
    modal.className = 'ai-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = `
      <div class="ai-modal-content" role="dialog" aria-modal="true" aria-labelledby="ai-title">
        <div class="ai-header">
          <div>
            <h2 id="ai-title">🤖 ClassDoodle AI Tutor</h2>
            <p class="ai-subtitle">Ask questions about any topic in your subjects</p>
          </div>
          <button class="ai-close" aria-label="Close AI Tutor">✕</button>
        </div>

        <div class="ai-quick-actions">
          <button type="button" class="ai-chip" data-prompt="Explain this topic simply with examples.">Explain simply</button>
          <button type="button" class="ai-chip" data-prompt="Create a short quiz (5 questions) on this topic.">Make a quiz</button>
          <button type="button" class="ai-chip" data-prompt="Give me step-by-step practice problems.">Practice problems</button>
          <button type="button" class="ai-chip" data-prompt="Summarize the key points and definitions.">Summarize</button>
        </div>

        <div class="ai-settings">
          <div class="ai-mode">
            <label for="ai-mode">Mode</label>
            <select id="ai-mode">
              <option value="tutor" selected>Smart Tutor</option>
              <option value="quiz">Quiz Generator</option>
              <option value="homework">Homework Checker</option>
            </select>
          </div>
          <label class="ai-toggle">
            <input type="checkbox" id="ai-page-toggle" checked>
            <span>Use current page</span>
          </label>
          <label class="ai-toggle">
            <input type="checkbox" id="ai-all-toggle" checked>
            <span>Connect all subjects</span>
          </label>
        </div>

        <div class="ai-body">
          <div id="ai-chat-log" class="ai-chat" aria-live="polite"></div>
        </div>

        <div class="ai-controls">
          <label class="ai-toggle">
            <input type="checkbox" id="ai-web-toggle" checked>
            <span>Allow web search</span>
          </label>
          <button type="button" class="ai-clear">New chat</button>
        </div>

        <form id="ai-form" class="ai-input" autocomplete="off" data-endpoint="/api/tutor">
          <textarea id="ai-input" rows="1" placeholder="Ask your tutor anything..." required></textarea>
          <button type="submit" class="ai-send">Send</button>
        </form>

        <div class="ai-footer">ClassDoodle AI is a tutor assistant. Verify important facts with your textbook.</div>
      </div>
    `;
    document.body.appendChild(modal);
  };

  injectAiUi();

  const modal = document.getElementById('ai-tutor-modal');
  const openBtn = document.querySelector('.floating-ai');
  const closeBtn = modal?.querySelector('.ai-close');
  const chatLog = document.getElementById('ai-chat-log');
  const form = document.getElementById('ai-form');
  const input = document.getElementById('ai-input');
  const clearBtn = modal?.querySelector('.ai-clear');
  const webToggle = document.getElementById('ai-web-toggle');
  const pageToggle = document.getElementById('ai-page-toggle');
  const allToggle = document.getElementById('ai-all-toggle');
  const modeSelect = document.getElementById('ai-mode');
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

  const appendMessage = (role, content, sources = []) => {
    const wrapper = document.createElement('div');
    wrapper.className = `ai-message ${role}`;

    const roleLabel = document.createElement('div');
    roleLabel.className = 'ai-role';
    roleLabel.textContent = role === 'assistant' ? 'Tutor' : role === 'user' ? 'You' : 'Note';

    const bubble = document.createElement('div');
    bubble.className = 'ai-bubble';
    bubble.textContent = content;

    wrapper.append(roleLabel, bubble);

    if (sources.length && role === 'assistant') {
      const sourceBlock = document.createElement('div');
      sourceBlock.className = 'ai-sources';
      const heading = document.createElement('div');
      heading.textContent = 'Sources';
      const list = document.createElement('ul');
      sources.slice(0, 6).forEach((source, idx) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = `${idx + 1}. ${source.title || source.url}`;
        item.appendChild(link);
        list.appendChild(item);
      });
      sourceBlock.append(heading, list);
      wrapper.appendChild(sourceBlock);
    }

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

  const SUBJECT_INDEX_URL = '/assets/ai/subject-index.json';
  let subjectIndexCache = null;

  const fetchSubjectIndex = async () => {
    if (subjectIndexCache) return subjectIndexCache;
    const response = await fetch(SUBJECT_INDEX_URL, { cache: 'no-store' });
    if (!response.ok) return [];
    subjectIndexCache = await response.json();
    return subjectIndexCache;
  };

  const extractTextFromDom = (root) => {
    const nodes = root.querySelectorAll('h1, h2, h3, p, li');
    const parts = [];
    nodes.forEach(node => {
      const text = node.textContent?.trim();
      if (text) parts.push(text);
    });
    return parts.join('\n');
  };

  const summarizeText = (text, limit = 1200) => {
    if (!text) return '';
    return text.length > limit ? `${text.slice(0, limit)}...` : text;
  };

  const getCurrentPageSource = () => {
    const main = document.querySelector('main') || document.body;
    const raw = extractTextFromDom(main);
    return {
      title: document.title,
      url: `${window.location.origin}${window.location.pathname}`,
      excerpt: summarizeText(raw, 1400)
    };
  };

  const fetchPageSource = async (url) => {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) return null;
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const main = doc.querySelector('main') || doc.body;
    const raw = extractTextFromDom(main);
    return {
      title: doc.title || url,
      url: new URL(url, window.location.origin).href,
      excerpt: summarizeText(raw, 1000)
    };
  };

  const buildLocalSources = async () => {
    const sources = [];
    if (pageToggle?.checked) {
      sources.push(getCurrentPageSource());
    }

    if (allToggle?.checked) {
      const index = await fetchSubjectIndex();
      const currentPath = window.location.pathname.replace(/\\/g, '/');
      for (const item of index) {
        if (sources.length >= 6) break;
        if (item.path === currentPath) continue;
        const source = await fetchPageSource(item.path);
        if (source) sources.push(source);
      }
    }

    const totalLimit = 6000;
    let total = 0;
    return sources.map(source => {
      const remaining = Math.max(totalLimit - total, 0);
      const excerpt = summarizeText(source.excerpt, Math.min(remaining, 1400));
      total += excerpt.length;
      return { ...source, excerpt };
    });
  };

  const sendMessage = async (text) => {
    const endpoint = form.dataset.endpoint || '/api/tutor';
    const localSources = await buildLocalSources();
    const payload = {
      messages: messages.map(msg => ({ role: msg.role, content: msg.content })),
      userMessage: text,
      allowWeb: Boolean(webToggle?.checked),
      context: getPageContext(),
      mode: modeSelect?.value || 'tutor',
      localSources
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
      const sources = Array.isArray(data?.sources) ? data.sources : [];
      messages.push({ role: 'assistant', content: reply });
      appendMessage('assistant', reply, sources);
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
      if (prompt.toLowerCase().includes('quiz')) {
        modeSelect.value = 'quiz';
      }
      input.focus();
    });
  });

  restore();
})();
