import { ClassificationResult, RequirementCategory, UrgencyLevel } from '../types/index.js';

interface CategoryRule {
  category: RequirementCategory;
  intent: 'FAQ' | 'FORMAL_REQUIREMENT';
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'CERTIFICATE',
    intent: 'FORMAL_REQUIREMENT',
    keywords: ['bonafide', 'certificate', 'study certificate', 'conduct certificate', 'recommendation letter', 'lor'],
  },
  {
    category: 'APPOINTMENT',
    intent: 'FORMAL_REQUIREMENT',
    keywords: ['meet hod', 'appointment', 'schedule meeting', 'see hod', 'talk in person'],
  },
  {
    category: 'LEAVE',
    intent: 'FORMAL_REQUIREMENT',
    keywords: ['apply for leave', 'leave application', 'duty leave', 'medical leave', 'sick leave', 'on duty', 'od'],
  },
  {
    category: 'ATTENDANCE',
    intent: 'FORMAL_REQUIREMENT',
    keywords: ['attendance shortage', 'shortage of attendance', 'condonation', 'low attendance', 'attendance issue'],
  },
  {
    category: 'PROJECT_INTERNSHIP',
    intent: 'FORMAL_REQUIREMENT',
    keywords: ['internship noc', 'project guide', 'internship approval', 'project approval', 'final year project'],
  },
  {
    category: 'COMPLAINT_GRIEVANCE',
    intent: 'FORMAL_REQUIREMENT',
    keywords: ['complaint', 'grievance', 'unfair', 'report an issue', 'problem with faculty', 'harassment'],
  },
  {
    category: 'DEPARTMENT_INFO',
    intent: 'FAQ',
    keywords: ['office hours', 'timing', 'when can i meet', 'where is office', 'hod room', 'cabin', 'contact number'],
  },
  {
    category: 'EXAMINATION',
    intent: 'FAQ',
    keywords: ['exam schedule', 'hall ticket', 'revaluation', 'exam clash', 'admit card', 'timetable'],
  },
  {
    category: 'FEES_SCHOLARSHIPS',
    intent: 'FAQ',
    keywords: ['fees', 'fee payment', 'scholarship', 'tuition fee', 'dues', 'installment'],
  },
];

// Escalation triggers (harassment, safety, legal, grade disputes, or explicit human handoff)
const ESCALATION_KEYWORDS = [
  'harassment',
  'ragging',
  'threat',
  'abuse',
  'police',
  'legal',
  'lawyer',
  'court',
  'suicide',
  'depressed',
  'urgent',
  'emergency',
  'bribe',
  'corrupt',
  'speak to hod',
  'talk to hod',
  'human',
  'real person',
  'representative',
  'transfer to human',
];

export class MessageClassifier {
  public static classify(text: string): ClassificationResult {
    const normalized = text.toLowerCase().trim();

    // 1. Check for Critical Risk & Escalation Triggers
    for (const kw of ESCALATION_KEYWORDS) {
      if (normalized.includes(kw)) {
        const isCritical = ['suicide', 'threat', 'ragging', 'abuse', 'emergency'].some((c) =>
          normalized.includes(c)
        );

        return {
          category: normalized.includes('harassment') || normalized.includes('ragging')
            ? 'COMPLAINT_GRIEVANCE'
            : 'OTHER_UNKNOWN',
          intent: 'ESCALATION',
          confidence: 1.0,
          urgency: isCritical ? 'CRITICAL' : 'HIGH',
          isEscalated: true,
          escalationReason: `Triggered by escalation pattern: "${kw}"`,
        };
      }
    }

    // 2. Check for category matches
    let bestMatch: { rule: CategoryRule; score: number } | null = null;

    for (const rule of CATEGORY_RULES) {
      let score = 0;
      for (const kw of rule.keywords) {
        if (normalized.includes(kw)) {
          // Weight exact or longer keyword matches higher
          score += kw.length;
        }
      }

      if (score > 0 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { rule, score };
      }
    }

    if (bestMatch) {
      const confidence = Math.min(0.5 + bestMatch.score * 0.05, 0.95);
      return {
        category: bestMatch.rule.category,
        intent: bestMatch.rule.intent,
        confidence,
        urgency: 'NORMAL',
        isEscalated: false,
      };
    }

    // 3. Fallback / Unclear Intent
    return {
      category: 'OTHER_UNKNOWN',
      intent: 'UNCLEAR',
      confidence: 0.2,
      urgency: 'LOW',
      isEscalated: false,
    };
  }
}
