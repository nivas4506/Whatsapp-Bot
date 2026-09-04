import { repositories } from '../store/repositories/index.js';
export class FormRegistry {
    async resolveForm(category) {
        const config = await repositories.forms.getByCategory(category);
        if (config && config.status === 'ACTIVE') {
            return config;
        }
        return repositories.forms.getDefault();
    }
}
export const formRegistry = new FormRegistry();
