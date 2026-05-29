import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Settings } from '@rocket.chat/models';
import { capitalize } from '@rocket.chat/string-helpers';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../lib/deprecationWarningLogger';
import { notifyOnSettingChangedById } from '../lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		removeOAuthService(name: string): Promise<void>;
	}
}

export const removeOAuthServiceMethod = async (userId: string, name: string): Promise<void> => {
	if ((await hasPermissionAsync(userId, 'add-oauth-service')) !== true) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'removeOAuthService' });
	}

	const normalized = capitalize(name.toLowerCase().replace(/[^a-z0-9_]/g, ''));

	const settingsIds = [
		`Accounts_OAuth_Custom-${normalized}`,
		`Accounts_OAuth_Custom-${normalized}-url`,
		`Accounts_OAuth_Custom-${normalized}-token_path`,
		`Accounts_OAuth_Custom-${normalized}-identity_path`,
		`Accounts_OAuth_Custom-${normalized}-authorize_path`,
		`Accounts_OAuth_Custom-${normalized}-scope`,
		`Accounts_OAuth_Custom-${normalized}-access_token_param`,
		`Accounts_OAuth_Custom-${normalized}-token_sent_via`,
		`Accounts_OAuth_Custom-${normalized}-identity_token_sent_via`,
		`Accounts_OAuth_Custom-${normalized}-id`,
		`Accounts_OAuth_Custom-${normalized}-secret`,
		`Accounts_OAuth_Custom-${normalized}-button_label_text`,
		`Accounts_OAuth_Custom-${normalized}-button_label_color`,
		`Accounts_OAuth_Custom-${normalized}-button_color`,
		`Accounts_OAuth_Custom-${normalized}-login_style`,
		`Accounts_OAuth_Custom-${normalized}-key_field`,
		`Accounts_OAuth_Custom-${normalized}-username_field`,
		`Accounts_OAuth_Custom-${normalized}-email_field`,
		`Accounts_OAuth_Custom-${normalized}-name_field`,
		`Accounts_OAuth_Custom-${normalized}-avatar_field`,
		`Accounts_OAuth_Custom-${normalized}-roles_claim`,
		`Accounts_OAuth_Custom-${normalized}-merge_roles`,
		`Accounts_OAuth_Custom-${normalized}-roles_to_sync`,
		`Accounts_OAuth_Custom-${normalized}-merge_users`,
		`Accounts_OAuth_Custom-${normalized}-show_button`,
		`Accounts_OAuth_Custom-${normalized}-groups_claim`,
		`Accounts_OAuth_Custom-${normalized}-channels_admin`,
		`Accounts_OAuth_Custom-${normalized}-map_channels`,
		`Accounts_OAuth_Custom-${normalized}-groups_channel_map`,
		`Accounts_OAuth_Custom-${normalized}-merge_users_distinct_services`,
	];

	const promises = settingsIds.map((id) => Settings.removeById(id));

	(await Promise.all(promises)).forEach((value, index) => {
		if (value?.deletedCount) {
			void notifyOnSettingChangedById(settingsIds[index], 'removed');
		}
	});
};

Meteor.methods<ServerMethods>({
	async removeOAuthService(name) {
		methodDeprecationLogger.method('removeOAuthService', '9.0.0', '/v1/settings.removeCustomOAuth');
		check(name, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeOAuthService',
			});
		}

		await removeOAuthServiceMethod(userId, name);
	},
});
