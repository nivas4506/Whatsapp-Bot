import { repositories } from '../store/repositories/index.js';
import { FormConfig, RequirementCategory } from '../types/index.js';

export class FormRegistry {
  async resolveForm(category: RequirementCategory): Promise<FormConfig> {
    const config = await repositories.forms.getByCategory(category);
    if (config && config.status === 'ACTIVE') {
      return config;
    }
    return repositories.forms.getDefault();
  }
}

export const formRegistry = new FormRegistry();
