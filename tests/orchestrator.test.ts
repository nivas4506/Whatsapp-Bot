import { describe, it, expect, beforeEach } from 'vitest';
import { config } from '../src/config/index.js';
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
    expect(res?.ctaUrl?.url).toMatch(/google\.com\/forms|forms\.gle/);

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

  it('should allow student to check status of reference number in WhatsApp', async () => {
    // 1. Create requirement first
    const createRes = await orchestrator.processInboundMessage({
      providerMessageId: 'msg_test_req_track_01',
      from: testPhone,
      timestamp: new Date(),
      text: 'I want bonafide certificate',
      type: 'text',
    });
    const ref = createRes?.referenceId!;
    expect(ref).toBeDefined();

    // 2. Query status
    const trackRes = await orchestrator.processInboundMessage({
      providerMessageId: 'msg_test_req_track_02',
      from: testPhone,
      timestamp: new Date(),
      text: `STATUS ${ref}`,
      type: 'text',
    });

    expect(trackRes).not.toBeNull();
    expect(trackRes?.replyText).toContain(`Requirement Status: ${ref}`);
    expect(trackRes?.replyText).toContain('FORM_PENDING');
  });

  it('should allow HOD to view pending requests and approve directly in WhatsApp', async () => {
    // 1. Configure test HOD phone
    const hodPhone = '918888888888';
    (config as any).HOD_WHATSAPP_NUMBER = hodPhone;

    // 2. Student files leave request
    const studentRes = await orchestrator.processInboundMessage({
      providerMessageId: 'msg_student_leave_01',
      from: testPhone,
      timestamp: new Date(),
      text: 'I need to apply for leave for 2 days medical',
      type: 'text',
    });
    const ref = studentRes?.referenceId!;
    expect(ref).toBeDefined();

    // 3. HOD requests PENDING list via WhatsApp
    const listRes = await orchestrator.processInboundMessage({
      providerMessageId: 'msg_hod_list_01',
      from: hodPhone,
      timestamp: new Date(),
      text: 'PENDING',
      type: 'text',
    });
    expect(listRes?.replyText).toContain('Pending Student Requests');
    expect(listRes?.replyText).toContain(ref);

    // 4. HOD approves request via WhatsApp
    const approveRes = await orchestrator.processInboundMessage({
      providerMessageId: 'msg_hod_approve_01',
      from: hodPhone,
      timestamp: new Date(),
      text: `APPROVE ${ref} Approved. Take rest.`,
      type: 'text',
    });
    expect(approveRes?.replyText).toContain('Request Approved');
    expect(approveRes?.replyText).toContain(ref);

    // 5. Verify status in database is RESOLVED
    const updated = await repositories.requirements.findByReferenceId(ref);
    expect(updated?.status).toBe('RESOLVED');
  });
});
