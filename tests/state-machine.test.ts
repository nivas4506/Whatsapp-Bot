import { describe, it, expect } from 'vitest';
import { ConversationStateMachine } from '../src/core/state-machine.js';

describe('Conversation State Machine', () => {
  it('should allow valid transitions from NEW', () => {
    expect(ConversationStateMachine.canTransition('NEW', 'UNDERSTANDING')).toBe(true);
    expect(ConversationStateMachine.canTransition('NEW', 'FAQ_ANSWERING')).toBe(true);
    expect(ConversationStateMachine.canTransition('NEW', 'HUMAN_REVIEW')).toBe(true);
  });

  it('should allow REQUIREMENT_INTAKE to FORM_PENDING', () => {
    expect(ConversationStateMachine.canTransition('REQUIREMENT_INTAKE', 'FORM_PENDING')).toBe(true);
  });

  it('should throw error on invalid transition', () => {
    expect(() =>
      ConversationStateMachine.assertValidTransition('FORM_PENDING', 'NEW')
    ).toThrowError(/Invalid state transition/);
  });
});
