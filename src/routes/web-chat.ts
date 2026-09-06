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
      gap: 14px;
      padding: 14px 18px;
      background: #fbfdfc;
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

    #messages {
      overflow-y: auto;
      padding: 18px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background:
        linear-gradient(rgba(255,255,255,0.82), rgba(255,255,255,0.82)),
        repeating-linear-gradient(45deg, #eef4f0 0 12px, #e6eee9 12px 24px);
    }

    .message {
      max-width: min(680px, 88%);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 11px 13px;
      line-height: 1.45;
      font-size: 15px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
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

    .quick-actions {
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

    form {
      display: grid;
      grid-template-columns: 1fr auto;
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

    form button:disabled {
      background: #98aaa0;
      cursor: wait;
    }

    .error {
      color: #9d2f2f;
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
      .message { max-width: 94%; font-size: 14px; }
      form { grid-template-columns: 1fr; }
      form button { width: 100%; }
    }
  </style>
</head>
<body>
  <main class="shell">
    <header>
      <div class="mark" aria-hidden="true">HD</div>
      <div>
        <h1>Student Helpdesk</h1>
        <div class="sub">Department assistant for office hours, certificates, attendance, forms, and HOD requests.</div>
      </div>
    </header>
    <section id="messages" aria-live="polite"></section>
    <form id="chat-form">
      <input id="chat-input" name="message" autocomplete="off" maxlength="1200" placeholder="Type your message" />
      <button id="send-button" type="submit">Send</button>
    </form>
  </main>

  <script>
    const messages = document.getElementById('messages');
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const sessionKey = 'hod_helpdesk_web_session';
    const sessionId = localStorage.getItem(sessionKey) || crypto.randomUUID();
    localStorage.setItem(sessionKey, sessionId);

    function addMessage(text, role, options) {
      const bubble = document.createElement('article');
      bubble.className = 'message ' + role;
      bubble.textContent = text;

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

      messages.appendChild(bubble);
      messages.scrollTop = messages.scrollHeight;
    }

    async function sendMessage(text) {
      const trimmed = text.trim();
      if (!trimmed) return;

      addMessage(trimmed, 'user');
      input.value = '';
      sendButton.disabled = true;

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
        addMessage(data.replyText, 'bot', data.interactiveOptions);
      } catch (error) {
        addMessage('The helpdesk could not reply right now. Please try again.', 'bot error');
      } finally {
        sendButton.disabled = false;
        input.focus();
      }
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      sendMessage(input.value);
    });

    addMessage('Hello. Type "hi" to start, or ask about certificates, attendance, office hours, appointments, or HOD review.', 'bot');
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
