import { repositories } from '../store/repositories/index.js';
import { FAQEntry } from '../types/index.js';

export class FAQService {
  async getAnswer(query: string, locale: string = 'en'): Promise<FAQEntry | null> {
    return repositories.faqs.findMatching(query, locale);
  }

  async getAllActive(locale: string = 'en'): Promise<FAQEntry[]> {
    return repositories.faqs.listActive(locale);
  }
}

export const faqService = new FAQService();
