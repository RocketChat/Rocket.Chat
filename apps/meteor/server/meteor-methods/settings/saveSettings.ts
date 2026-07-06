import type { ISetting } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { twoFactorRequired } from '../../lib/2fa/twoFactorRequired';
import { methodDeprecationLogger } from '../../lib/deprecationWarningLogger';
import { validateSettingRules } from '../../lib/settingValidationRules';
import { saveSettingsBulk } from '../../settings/lib/saveSettingsBulk';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		saveSettings(
			changes: {
				_id: ISetting['_id'];
				value: ISetting['value'];
			}[],
		): Promise<boolean>;
	}
}

Meteor.methods<ServerMethods>({
	saveSettings: twoFactorRequired(async function (
		params: {
			_id: ISetting['_id'];
			value: ISetting['value'];
		}[] = [],
	) {
		methodDeprecationLogger.method('saveSettings', '9.0.0', '/v1/settings');

		const uid = Meteor.userId();
		if (uid === null) {
			throw new Meteor.Error('error-action-not-allowed', 'Editing settings is not allowed', {
				method: 'saveSetting',
			});
		}

		try {
			validateSettingRules(params);
		} catch (error) {
			// rethrow as Meteor.Error so the i18n key reaches the client (plain errors are masked as internal server errors)
			throw new Meteor.Error('error-setting-validation-failed', error instanceof Error ? error.message : String(error));
		}

		await saveSettingsBulk(uid, params, {
			username: (await Meteor.userAsync())!.username!,
			ip: this.connection.clientAddress || '',
			useragent: this.connection.httpHeaders['user-agent'] || '',
		});

		return true;
	}, {}),
});
