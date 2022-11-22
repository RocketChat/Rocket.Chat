import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

import { hasPermission } from '../../../authorization/server';
import { TranslationProviderRegistry } from '..';
import { settings } from '../../../settings/server';

Meteor.methods({
	'autoTranslate.getSupportedLanguages'(targetLanguage) {
		if (!settings.get('AutoTranslate_Enabled')) {
			throw new Meteor.Error('error-autotranslate-disabled', 'Auto-Translate is disabled');
		}

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getSupportedLanguages',
			});
		}

		if (!hasPermission(userId, 'auto-translate')) {
			throw new Meteor.Error('error-action-not-allowed', 'Auto-Translate is not allowed', {
				method: 'autoTranslate.saveSettings',
			});
		}

		return TranslationProviderRegistry.getSupportedLanguages(targetLanguage);
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'autoTranslate.getSupportedLanguages',
		userId(/* userId*/) {
			return true;
		},
	},
	5,
	60000,
);
