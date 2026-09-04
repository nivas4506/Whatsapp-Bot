import { repositories } from '../store/repositories/index.js';
export class FAQService {
    async getAnswer(query, locale = 'en') {
        return repositories.faqs.findMatching(query, locale);
    }
    async getAllActive(locale = 'en') {
        return repositories.faqs.listActive(locale);
    }
}
export const faqService = new FAQService();
