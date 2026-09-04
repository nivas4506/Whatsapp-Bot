import { describe, it, expect } from 'vitest';
import { MessageClassifier } from '../src/core/classifier.js';

describe('Message Classifier', () => {
  it('should classify office hours as DEPARTMENT_INFO FAQ', () => {
    const res = MessageClassifier.classify('What are the HOD office hours?');
    expect(res.category).toBe('DEPARTMENT_INFO');
    expect(res.intent).toBe('FAQ');
    expect(res.isEscalated).toBe(false);
  });

  it('should classify bonafide certificate as CERTIFICATE FORMAL_REQUIREMENT', () => {
    const res = MessageClassifier.classify('I need a bonafide certificate for passport verification');
    expect(res.category).toBe('CERTIFICATE');
    expect(res.intent).toBe('FORMAL_REQUIREMENT');
    expect(res.isEscalated).toBe(false);
  });

  it('should classify attendance shortage as ATTENDANCE FORMAL_REQUIREMENT', () => {
    const res = MessageClassifier.classify('I have an attendance shortage in semester 5');
    expect(res.category).toBe('ATTENDANCE');
    expect(res.intent).toBe('FORMAL_REQUIREMENT');
  });

  it('should classify appointment request as APPOINTMENT FORMAL_REQUIREMENT', () => {
    const res = MessageClassifier.classify('I want an appointment to meet HOD tomorrow');
    expect(res.category).toBe('APPOINTMENT');
    expect(res.intent).toBe('FORMAL_REQUIREMENT');
  });

  it('should escalate sensitive harassment or ragging cases with CRITICAL urgency', () => {
    const res = MessageClassifier.classify('I want to report ragging and harassment in the department');
    expect(res.intent).toBe('ESCALATION');
    expect(res.isEscalated).toBe(true);
    expect(res.urgency).toBe('CRITICAL');
  });

  it('should escalate explicit request to speak to HOD', () => {
    const res = MessageClassifier.classify('I need to speak to HOD immediately');
    expect(res.intent).toBe('ESCALATION');
    expect(res.isEscalated).toBe(true);
  });

  it('should handle unclear messages with fallback classification', () => {
    const res = MessageClassifier.classify('xyz 123 completely random string');
    expect(res.intent).toBe('UNCLEAR');
    expect(res.category).toBe('OTHER_UNKNOWN');
    expect(res.isEscalated).toBe(false);
  });
});
