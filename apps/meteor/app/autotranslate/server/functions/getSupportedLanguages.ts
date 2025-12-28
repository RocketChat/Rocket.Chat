import { Meteor } from 'meteor/meteor';

import { TranslationProviderRegistry } from '..';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';

export const getSupportedLanguages = async (userId: string, targetLanguage: string) => {
	if (!settings.get('AutoTranslate_Enabled')) {
		throw new Meteor.Error('error-autotranslate-disabled', 'Auto-Translate is disabled');
	}

	if (!(await hasPermissionAsync(userId, 'auto-translate'))) {
		throw new Meteor.Error('error-action-not-allowed', 'Auto-Translate is not allowed', {
			method: 'autoTranslate.getSupportedLanguages',
		});
	}

	return TranslationProviderRegistry.getSupportedLanguages(targetLanguage);
};
