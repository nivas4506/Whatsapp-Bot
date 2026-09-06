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
    expect(res.text).toContain('data.ctaUrl');
    expect(res.text).toContain("link.target = '_blank'");
    expect(res.text).toContain('starter-grid');
    expect(res.text).toContain('formatReply');
    expect(res.text).toContain('typing-indicator');
    expect(res.text).toContain('Clear');
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

  it('POST /chat/message attaches the Google Form for formal requests', async () => {
    const res = await request(app)
      .post('/chat/message')
      .send({ sessionId: 'student-browser-form-1', text: 'I need a bonafide certificate' });

    expect(res.status).toBe(200);
    expect(res.body.replyText).toContain('Formal Requirement Recorded');
    expect(res.body.ctaUrl).toEqual({
      title: 'Open Google Form',
      url: 'https://docs.google.com/forms/d/e/1FAIpQLSfySrK4U9_TQdbxuKSGxDymYTRcJQTEpOV-cMFMHztboQVqcQ/viewform',
    });
  });

  it('POST /chat/message rejects empty messages', async () => {
    const res = await request(app)
      .post('/chat/message')
      .send({ sessionId: 'student-browser-1', text: '   ' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Message text is required');
  });
});
