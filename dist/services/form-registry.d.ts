import { FormConfig, RequirementCategory } from '../types/index.js';
export declare class FormRegistry {
    resolveForm(category: RequirementCategory): Promise<FormConfig>;
}
export declare const formRegistry: FormRegistry;
