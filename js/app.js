'use strict';

/* =========================================
   app.js – UI logic for the RichDad Q&A bot
   ========================================= */

const bot = new RichDadBot();

// DOM references
const chatWindow    = document.getElementById('chat-window');
const userInput     = document.getElementById('user-input');
const sendBtn       = document.getElementById('send-btn');
const statusDot     = document.getElementById('status-dot');
const loadingOverlay = document.getElementById('loading-overlay');
const installBanner = document.getElementById('install-banner');
const installBtn    = document.getElementById('install-btn');
const installDismiss = document.getElementById('install-dismiss');
const suggestions   = document.getElementById('suggestions');

// Suggested questions for quick access
const SUGGESTED_QUESTIONS = [
  'What is an asset?',
  'What is the difference between rich and poor dad?',
  'How do I achieve financial freedom?',
  'What is cash flow?',
  'Why should I invest?',
  'What does pay yourself first mean?',
];

let deferredInstallPrompt = null;
let isTyping = false;

const MIN_TYPING_DELAY  = 600;  // ms – minimum simulated typing delay
const RANDOM_TYPING_RANGE = 400; // ms – additional random range on top of minimum

/* ---------- Initialisation ---------- */

async function init() {
  try {
    statusDot.classList.add('loading');
    await bot.load('./data/richdad_poordad.txt');
    statusDot.classList.remove('loading');
    loadingOverlay.classList.add('hidden');
    renderSuggestions();
  } catch (err) {
    console.error('Bot load error:', err);
    loadingOverlay.innerHTML = `
      <div style="text-align:center;padding:20px">
        <p style="color:#ff6b6b;margin-bottom:12px">⚠️ Failed to load book content.</p>
        <button onclick="location.reload()" style="padding:8px 20px;background:#f4a228;border:none;border-radius:8px;cursor:pointer;font-size:14px">
          Retry
        </button>
      </div>`;
  }
}

/* ---------- Rendering helpers ---------- */

function renderSuggestions() {
  suggestions.innerHTML = '';
  SUGGESTED_QUESTIONS.forEach(q => {
    const chip = document.createElement('button');
    chip.className = 'chip';
    chip.textContent = q;
    chip.addEventListener('click', () => submitQuestion(q));
    suggestions.appendChild(chip);
  });
}

function appendMessage(role, text) {
  // Hide welcome screen on first message
  const welcome = document.getElementById('welcome');
  if (welcome) welcome.remove();

  const wrapper = document.createElement('div');
  wrapper.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = role === 'user' ? '👤' : '📚';

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = formatText(text);

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return bubble;
}

/** Convert newlines and basic markdown-ish formatting to HTML. */
function formatText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.*)$/, '<p>$1</p>');
}

function showTypingIndicator() {
  const wrapper = document.createElement('div');
  wrapper.className = 'message bot';
  wrapper.id = 'typing';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.textContent = '📚';

  const bubble = document.createElement('div');
  bubble.className = 'bubble typing-indicator';
  bubble.innerHTML = '<span></span><span></span><span></span>';

  wrapper.appendChild(avatar);
  wrapper.appendChild(bubble);
  chatWindow.appendChild(wrapper);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById('typing');
  if (el) el.remove();
}

/* ---------- Q&A flow ---------- */

function submitQuestion(questionText) {
  const text = (questionText || userInput.value).trim();
  if (!text || isTyping) return;

  userInput.value = '';
  autoResize();
  appendMessage('user', text);
  sendBtn.disabled = true;
  isTyping = true;
  showTypingIndicator();

  setTimeout(() => {
    removeTypingIndicator();
    const { answer, confidence } = bot.answer(text);
    const bubble = appendMessage('bot', answer);

    if (confidence > 0) {
      const hint = document.createElement('div');
      hint.className = 'source-hint';
      hint.textContent = '📖 Rich Dad Poor Dad';
      bubble.appendChild(hint);
    }

    sendBtn.disabled = false;
    isTyping = false;
    userInput.focus();
  }, MIN_TYPING_DELAY + Math.random() * RANDOM_TYPING_RANGE);
}

/* ---------- Event listeners ---------- */

sendBtn.addEventListener('click', () => submitQuestion());

userInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitQuestion();
  }
});

userInput.addEventListener('input', autoResize);

function autoResize() {
  userInput.style.height = 'auto';
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
}

/* ---------- PWA install prompt ---------- */

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredInstallPrompt = e;
  installBanner.classList.add('visible');
});

installBtn.addEventListener('click', async () => {
  if (!deferredInstallPrompt) return;
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    installBanner.classList.remove('visible');
  }
  deferredInstallPrompt = null;
});

installDismiss.addEventListener('click', () => {
  installBanner.classList.remove('visible');
});

window.addEventListener('appinstalled', () => {
  installBanner.classList.remove('visible');
  deferredInstallPrompt = null;
});

/* ---------- Service Worker registration ---------- */

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./service-worker.js').catch(err => {
    console.warn('Service worker registration failed:', err);
  });
}

/* ---------- Boot ---------- */
init();
