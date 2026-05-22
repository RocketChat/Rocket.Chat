import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { saveAutoTranslateSettings } from '../functions/saveSettings';

declare module '@rocket.chat/ddp-client' {
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

		return saveAutoTranslateSettings(userId, rid, field, value, options);
	},
});
