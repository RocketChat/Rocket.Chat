import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../app/settings/server';
import { hasPermissionAsync } from '../../authorization/hasPermission';
import { TranslationProviderRegistry } from '../index';

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
