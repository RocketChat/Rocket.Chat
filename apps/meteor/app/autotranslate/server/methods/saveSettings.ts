import { Subscriptions } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'autoTranslate.saveSettings'(rid: string, field: string, value: string, options: { defaultLanguage: string }): boolean;
	}
}

Meteor.methods<ServerMethods>({
	async 'autoTranslate.saveSettings'(rid, field, value, options) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'saveAutoTranslateSettings',
			});
		}

		if (!(await hasPermissionAsync(userId, 'auto-translate'))) {
			throw new Meteor.Error('error-action-not-allowed', 'Auto-Translate is not allowed', {
				method: 'autoTranslate.saveSettings',
			});
		}

		check(rid, String);
		check(field, String);
		check(value, String);

		if (['autoTranslate', 'autoTranslateLanguage'].indexOf(field) === -1) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings field', {
				method: 'saveAutoTranslateSettings',
			});
		}

		const subscription = await Subscriptions.findOneByRoomIdAndUserId(rid, userId);
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', {
				method: 'saveAutoTranslateSettings',
			});
		}

		switch (field) {
			case 'autoTranslate':
				await Subscriptions.updateAutoTranslateById(subscription._id, value === '1');
				if (!subscription.autoTranslateLanguage && options.defaultLanguage) {
					await Subscriptions.updateAutoTranslateLanguageById(subscription._id, options.defaultLanguage);
				}
				break;
			case 'autoTranslateLanguage':
				await Subscriptions.updateAutoTranslateLanguageById(subscription._id, value);
				break;
		}

		return true;
	},
});
