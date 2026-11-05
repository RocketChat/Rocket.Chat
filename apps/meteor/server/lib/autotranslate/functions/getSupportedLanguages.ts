import { ClientSafeError } from '@rocket.chat/core-services';

import { settings } from '../../../settings';
import { hasPermissionAsync } from '../../authorization/hasPermission';
import { TranslationProviderRegistry } from '../index';

export const getSupportedLanguages = async (userId: string, targetLanguage: string) => {
	if (!settings.get('AutoTranslate_Enabled')) {
		throw new ClientSafeError('error-autotranslate-disabled', 'Auto-Translate is disabled');
	}

	if (!(await hasPermissionAsync(userId, 'auto-translate'))) {
		throw new ClientSafeError('error-action-not-allowed', 'Auto-Translate is not allowed', {
			method: 'autoTranslate.getSupportedLanguages',
		});
	}

	return TranslationProviderRegistry.getSupportedLanguages(targetLanguage);
};
