import { IContactRepository, IConversationRepository, IMessageRepository, IRequirementRepository, IFAQRepository, IFormConfigRepository, IAuditRepository } from './interfaces.js';
export interface Repositories {
    contacts: IContactRepository;
    conversations: IConversationRepository;
    messages: IMessageRepository;
    requirements: IRequirementRepository;
    faqs: IFAQRepository;
    forms: IFormConfigRepository;
    audit: IAuditRepository;
}
export declare const repositories: Repositories;
export declare function createMemoryRepositories(): Repositories;
