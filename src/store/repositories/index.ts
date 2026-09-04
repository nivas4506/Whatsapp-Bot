import { config } from '../../config/index.js';
import {
  IContactRepository,
  IConversationRepository,
  IMessageRepository,
  IRequirementRepository,
  IFAQRepository,
  IFormConfigRepository,
  IAuditRepository,
} from './interfaces.js';
import {
  PgContactRepository,
  PgConversationRepository,
  PgMessageRepository,
  PgRequirementRepository,
  PgFAQRepository,
  PgFormConfigRepository,
  PgAuditRepository,
} from './pg-repositories.js';
import {
  MemoryContactRepository,
  MemoryConversationRepository,
  MemoryMessageRepository,
  MemoryRequirementRepository,
  MemoryFAQRepository,
  MemoryFormConfigRepository,
  MemoryAuditRepository,
} from './memory-repositories.js';

export interface Repositories {
  contacts: IContactRepository;
  conversations: IConversationRepository;
  messages: IMessageRepository;
  requirements: IRequirementRepository;
  faqs: IFAQRepository;
  forms: IFormConfigRepository;
  audit: IAuditRepository;
}

const useMemory =
  process.env.NODE_ENV === 'test' ||
  process.env.USE_MEMORY_STORE === 'true' ||
  process.env.DATABASE_URL?.includes(':memory:');

export const repositories: Repositories = useMemory
  ? {
      contacts: new MemoryContactRepository(),
      conversations: new MemoryConversationRepository(),
      messages: new MemoryMessageRepository(),
      requirements: new MemoryRequirementRepository(),
      faqs: new MemoryFAQRepository(),
      forms: new MemoryFormConfigRepository(),
      audit: new MemoryAuditRepository(),
    }
  : {
      contacts: new PgContactRepository(),
      conversations: new PgConversationRepository(),
      messages: new PgMessageRepository(),
      requirements: new PgRequirementRepository(),
      faqs: new PgFAQRepository(),
      forms: new PgFormConfigRepository(),
      audit: new PgAuditRepository(),
    };

export function createMemoryRepositories(): Repositories {
  return {
    contacts: new MemoryContactRepository(),
    conversations: new MemoryConversationRepository(),
    messages: new MemoryMessageRepository(),
    requirements: new MemoryRequirementRepository(),
    faqs: new MemoryFAQRepository(),
    forms: new MemoryFormConfigRepository(),
    audit: new MemoryAuditRepository(),
  };
}
