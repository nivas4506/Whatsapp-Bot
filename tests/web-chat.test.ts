import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Web Chat', () => {
  it('GET /chat returns the browser chat experience', async () => {
    const res = await request(app).get('/chat');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Student Helpdesk');
    expect(res.text).toContain('/chat/message');
  });

  it('POST /chat/message returns a bot reply for a student message', async () => {
    const res = await request(app)
      .post('/chat/message')
      .send({ sessionId: 'student-browser-1', text: 'hi' });

    expect(res.status).toBe(200);
    expect(res.body.replyText).toContain('Welcome to the official');
    expect(res.body.conversationId).toBeTruthy();
    expect(res.body.nextState).toBe('UNDERSTANDING');
    expect(res.body.interactiveOptions).toHaveLength(3);
  });

  it('POST /chat/message rejects empty messages', async () => {
    const res = await request(app)
      .post('/chat/message')
      .send({ sessionId: 'student-browser-1', text: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Message text is required');
  });
});
