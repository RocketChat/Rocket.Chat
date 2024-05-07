import type { ISupportedLanguage } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';

import { TranslationProviderRegistry } from '..';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'autoTranslate.getSupportedLanguages'(targetLanguage: string): ISupportedLanguage[] | undefined;
	}
}

Meteor.methods<ServerMethods>({
	async 'autoTranslate.getSupportedLanguages'(targetLanguage) {
		if (!settings.get('AutoTranslate_Enabled')) {
			throw new Meteor.Error('error-autotranslate-disabled', 'Auto-Translate is disabled');
		}

		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'getSupportedLanguages',
			});
		}

		if (!(await hasPermissionAsync(userId, 'auto-translate'))) {
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
