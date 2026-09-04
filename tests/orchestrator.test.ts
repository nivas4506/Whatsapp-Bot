import { describe, it, expect, beforeEach } from 'vitest';
import { orchestrator } from '../src/core/orchestrator.js';
import { repositories } from '../src/store/repositories/index.js';

describe('Conversation Orchestrator', () => {
  const testPhone = '919988776655';

  it('should deliver welcome message on first contact (Hi)', async () => {
    const res = await orchestrator.processInboundMessage({
      providerMessageId: 'msg_test_001',
      from: testPhone,
      timestamp: new Date(),
      text: 'Hi',
      type: 'text',
    });

    expect(res).not.toBeNull();
    expect(res?.nextState).toBe('UNDERSTANDING');
    expect(res?.replyText).toContain('Welcome to the official');
    expect(res?.replyText).toContain('Privacy Notice');
  });

  it('should answer FAQ queries with approved information', async () => {
    const res = await orchestrator.processInboundMessage({
      providerMessageId: 'msg_test_002',
      from: testPhone,
      timestamp: new Date(),
      text: 'What are HOD office hours and room number?',
      type: 'text',
    });

    expect(res).not.toBeNull();
    expect(res?.nextState).toBe('FAQ_ANSWERING');
    expect(res?.replyText).toContain('Room 304');
    expect(res?.replyText).toContain('Monday to Friday');
  });

  it('should record formal requirement and generate reference ID and Google Form link', async () => {
    const res = await orchestrator.processInboundMessage({
      providerMessageId: 'msg_test_003',
      from: testPhone,
      timestamp: new Date(),
      text: 'I need a bonafide certificate for my passport application',
      type: 'text',
    });

    expect(res).not.toBeNull();
    expect(res?.nextState).toBe('FORM_PENDING');
    expect(res?.referenceId).toMatch(/^HOD-REQ-/);
    expect(res?.replyText).toContain('Formal Requirement Recorded');
    expect(res?.ctaUrl?.url).toContain('https://forms.gle/');

    // Verify stored in repository
    const storedReq = await repositories.requirements.findByReferenceId(res!.referenceId!);
    expect(storedReq).not.toBeNull();
    expect(storedReq?.category).toBe('CERTIFICATE');
    expect(storedReq?.status).toBe('FORM_PENDING');
  });

  it('should escalate sensitive issues to HUMAN_REVIEW and notify HOD', async () => {
    const res = await orchestrator.processInboundMessage({
      providerMessageId: 'msg_test_004',
      from: testPhone,
      timestamp: new Date(),
      text: 'I want to speak to HOD about unfair evaluation and harassment',
      type: 'text',
    });

    expect(res).not.toBeNull();
    expect(res?.nextState).toBe('HUMAN_REVIEW');
    expect(res?.replyText).toContain('Case Escalated for Review');
    expect(res?.referenceId).toBeDefined();
  });

  it('should reject duplicate message IDs for idempotency', async () => {
    const duplicateId = 'msg_idempotent_test_001';

    const first = await orchestrator.processInboundMessage({
      providerMessageId: duplicateId,
      from: testPhone,
      timestamp: new Date(),
      text: 'Hello',
      type: 'text',
    });
    expect(first).not.toBeNull();

    // Second call with same message ID
    const second = await orchestrator.processInboundMessage({
      providerMessageId: duplicateId,
      from: testPhone,
      timestamp: new Date(),
      text: 'Hello again',
      type: 'text',
    });
    expect(second).toBeNull();
  });
});
