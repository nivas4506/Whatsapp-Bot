import { FAQEntry } from '../types/index.js';
export declare class FAQService {
    getAnswer(query: string, locale?: string): Promise<FAQEntry | null>;
    getAllActive(locale?: string): Promise<FAQEntry[]>;
}
export declare const faqService: FAQService;
