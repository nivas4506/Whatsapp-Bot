import crypto from 'crypto';
import { Router, Request, Response } from 'express';
import { orchestrator } from '../core/orchestrator.js';

export const webChatRouter = Router();

const chatPage = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Student Helpdesk Chat</title>
  <style>
    :root {
      color-scheme: light;
      --ink: #17211c;
      --muted: #5d6962;
      --line: #d7ded9;
      --panel: #ffffff;
      --bg: #eef4f0;
      --brand: #0f8f5f;
      --brand-dark: #086541;
      --accent: #d98e22;
      --student: #1f5c99;
      --danger: #9d2f2f;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        linear-gradient(135deg, rgba(15, 143, 95, 0.10), rgba(217, 142, 34, 0.10)),
        var(--bg);
      color: var(--ink);
      display: grid;
      place-items: center;
      padding: 20px;
    }

    .shell {
      width: min(960px, 100%);
      height: min(760px, calc(100vh - 40px));
      min-height: 560px;
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      box-shadow: 0 18px 55px rgba(23, 33, 28, 0.14);
      display: grid;
      grid-template-rows: auto 1fr auto;
      overflow: hidden;
    }

    header {
      min-height: 76px;
      border-bottom: 1px solid var(--line);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 14px 18px;
      background: #fbfdfc;
    }

    .identity {
      display: flex;
      align-items: center;
      gap: 14px;
      min-width: 0;
    }

    .mark {
      width: 46px;
      height: 46px;
      border-radius: 8px;
      background: var(--brand);
      display: grid;
      place-items: center;
      color: #fff;
      font-weight: 800;
      font-size: 18px;
      flex: 0 0 auto;
    }

    h1 {
      margin: 0;
      font-size: 19px;
      line-height: 1.2;
      letter-spacing: 0;
    }

    .sub {
      margin-top: 4px;
      color: var(--muted);
      font-size: 13px;
      line-height: 1.35;
    }

    .status-pill {
      border: 1px solid #b8d2c6;
      border-radius: 999px;
      color: var(--brand-dark);
      background: #f6fbf8;
      font-size: 12px;
      font-weight: 700;
      padding: 7px 10px;
      white-space: nowrap;
    }

    #messages {
      overflow-y: auto;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background:
        linear-gradient(rgba(255,255,255,0.90), rgba(255,255,255,0.90)),
        linear-gradient(135deg, #e8f4ee, #f8efe2);
    }

    .message {
      max-width: min(680px, 88%);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 11px 13px;
      line-height: 1.45;
      font-size: 15px;
      overflow-wrap: anywhere;
    }

    .message p {
      margin: 0 0 9px;
    }

    .message p:last-child {
      margin-bottom: 0;
    }

    .message strong {
      font-weight: 800;
    }

    .bot {
      align-self: flex-start;
      background: #fff;
    }

    .user {
      align-self: flex-end;
      background: #eaf3fb;
      border-color: #c6dced;
    }

    .typing-indicator {
      align-self: flex-start;
      width: 76px;
      min-height: 42px;
      display: none;
      align-items: center;
      gap: 5px;
      padding: 11px 13px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
    }

    .typing-indicator span {
      width: 7px;
      height: 7px;
      border-radius: 999px;
      background: var(--muted);
      animation: pulse 1s infinite ease-in-out;
    }

    .typing-indicator span:nth-child(2) { animation-delay: 0.15s; }
    .typing-indicator span:nth-child(3) { animation-delay: 0.30s; }

    @keyframes pulse {
      0%, 80%, 100% { opacity: 0.35; transform: translateY(0); }
      40% { opacity: 1; transform: translateY(-3px); }
    }

    .quick-actions, .link-actions, .starter-grid {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 10px;
    }

    button, input {
      font: inherit;
    }

    .quick-actions button {
      border: 1px solid #b8d2c6;
      background: #f6fbf8;
      color: var(--brand-dark);
      border-radius: 8px;
      padding: 8px 10px;
      cursor: pointer;
      min-height: 36px;
    }

    .quick-actions button:hover,
    .starter-grid button:hover {
      border-color: var(--brand);
      background: #eef8f2;
    }

    .starter-grid {
      margin-top: 14px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      max-width: min(680px, 100%);
    }

    .starter-grid button {
      min-height: 44px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: #fff;
      color: var(--ink);
      text-align: left;
      padding: 10px 12px;
      cursor: pointer;
    }

    .link-actions a {
      border: 1px solid var(--brand);
      background: var(--brand);
      color: #fff;
      border-radius: 8px;
      padding: 9px 12px;
      min-height: 38px;
      display: inline-flex;
      align-items: center;
      text-decoration: none;
      font-weight: 700;
    }

    form {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 10px;
      padding: 14px;
      border-top: 1px solid var(--line);
      background: #fbfdfc;
    }

    input {
      min-width: 0;
      min-height: 46px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 0 13px;
      color: var(--ink);
      background: #fff;
    }

    form button {
      min-width: 94px;
      min-height: 46px;
      border: 0;
      border-radius: 8px;
      color: #fff;
      background: var(--brand);
      font-weight: 700;
      cursor: pointer;
    }

    #clear-button {
      min-width: 46px;
      border: 1px solid var(--line);
      background: #fff;
      color: var(--muted);
      font-weight: 700;
    }

    form button:disabled {
      background: #98aaa0;
      cursor: wait;
    }

    .error {
      color: var(--danger);
      border-color: #edc2c2;
      background: #fff7f7;
    }

    @media (max-width: 620px) {
      body { padding: 0; }
      .shell {
        height: 100vh;
        min-height: 100vh;
        border-radius: 0;
        border: 0;
      }
      h1 { font-size: 17px; }
      .sub { font-size: 12px; }
      .status-pill { display: none; }
      .message { max-width: 94%; font-size: 14px; }
      .starter-grid { grid-template-columns: 1fr; }
      form { grid-template-columns: auto 1fr; }
      form button { width: 100%; }
      #send-button { grid-column: 1 / -1; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header>
      <div class="identity">
        <div class="mark" aria-hidden="true">HD</div>
        <div>
          <h1>Student Helpdesk</h1>
          <div class="sub">Department assistant for office hours, certificates, attendance, forms, and HOD requests.</div>
        </div>
      </div>
      <div class="status-pill">Online</div>
    </header>
    <section id="messages" aria-live="polite"></section>
    <form id="chat-form">
      <button id="clear-button" type="button" title="Clear chat">Clear</button>
      <input id="chat-input" name="message" autocomplete="off" maxlength="1200" placeholder="Type your message" />
      <button id="send-button" type="submit">Send</button>
    </form>
  </main>

  <script>
    const messages = document.getElementById('messages');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const clearButton = document.getElementById('clear-button');
    const sessionKey = 'hod_helpdesk_web_session';
    const sessionId = localStorage.getItem(sessionKey) || crypto.randomUUID();
    localStorage.setItem(sessionKey, sessionId);
    let typingBubble;

    function escapeHtml(value) {
      return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function formatReply(text) {
      return escapeHtml(text)
        .replace(/\\*([^*]+)\\*/g, '<strong>$1</strong>')
        .split(/\\n\\n+/)
        .map((part) => '<p>' + part.replace(/\\n/g, '<br>') + '</p>')
        .join('');
    }

    function setTyping(isTyping) {
      if (!isTyping && !typingBubble) {
        return;
      }
      if (!typingBubble) {
        typingBubble = document.createElement('div');
        typingBubble.className = 'typing-indicator';
        typingBubble.setAttribute('aria-label', 'Bot is typing');
        typingBubble.innerHTML = '<span></span><span></span><span></span>';
        messages.appendChild(typingBubble);
      }
      typingBubble.style.display = isTyping ? 'flex' : 'none';
      messages.scrollTop = messages.scrollHeight;
    }

    function addMessage(text, role, options, ctaUrl) {
      const bubble = document.createElement('article');
      bubble.className = 'message ' + role;
      bubble.innerHTML = formatReply(text);

      if (options && options.length) {
        const actions = document.createElement('div');
        actions.className = 'quick-actions';
        options.forEach((option) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = option.title;
          button.addEventListener('click', () => sendMessage(option.title));
          actions.appendChild(button);
        });
        bubble.appendChild(actions);
      }

      if (ctaUrl && ctaUrl.url) {
        const links = document.createElement('div');
        links.className = 'link-actions';
        const link = document.createElement('a');
        link.href = ctaUrl.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = ctaUrl.title || 'Open Google Form';
        links.appendChild(link);
        bubble.appendChild(links);
      }

      setTyping(false);
      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
    }

    async function sendMessage(text) {
      const trimmed = text.trim();
      if (!trimmed) return;

      addMessage(trimmed, 'user');
      input.value = '';
      sendButton.disabled = true;
      setTyping(true);

      try {
        const response = await fetch('/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, text: trimmed })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Chat request failed');
        }
        addMessage(data.replyText, 'bot', data.interactiveOptions, data.ctaUrl);
      } catch (error) {
        addMessage('The helpdesk could not reply right now. Please try again.', 'bot error');
      } finally {
        setTyping(false);
        sendButton.disabled = false;
        input.focus();
      }
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      sendMessage(input.value);
    });

    clearButton.addEventListener('click', () => {
      messages.innerHTML = '';
      typingBubble = undefined;
      addMessage('Hello. Type "hi" to start, or choose a request below.', 'bot');
      renderStarterActions();
      input.focus();
    });

    function renderStarterActions() {
      const actions = document.createElement('div');
      actions.className = 'starter-grid';
      [
        'HOD office hours',
        'I need a bonafide certificate',
        'Attendance or leave issue',
        'Request appointment with HOD'
      ].forEach((label) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.addEventListener('click', () => sendMessage(label));
        actions.appendChild(button);
      });
      messages.appendChild(actions);
    }

    addMessage('Hello. Type "hi" to start, or ask about certificates, attendance, office hours, appointments, or HOD review.', 'bot');
    renderStarterActions();
  </script>
</body>
</html>`;

webChatRouter.get('/', (_req: Request, res: Response) => {
  res.type('html').send(chatPage);
});

webChatRouter.post('/message', async (req: Request, res: Response): Promise<void> => {
  const text = typeof req.body?.text === 'string' ? req.body.text.trim() : '';
  const sessionId = typeof req.body?.sessionId === 'string' ? req.body.sessionId.trim() : '';

  if (!text) {
    res.status(400).json({ error: 'Message text is required' });
    return;
  }

  const safeSessionId = sessionId || crypto.randomUUID();
  const inbound = {
    providerMessageId: `web_${safeSessionId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    from: `web:${safeSessionId}`,
    timestamp: new Date(),
    text,
    type: 'text' as const,
  };

  try {
    const result = await orchestrator.processInboundMessage(inbound, { dispatchOutbound: false });
    if (!result) {
      res.status(409).json({ error: 'Message was already processed' });
      return;
    }

    res.status(200).json(result);
  } catch (err: any) {
    console.error('[WebChat] Error processing message:', err.message);
    res.status(500).json({ error: 'Unable to process chat message' });
  }
});
