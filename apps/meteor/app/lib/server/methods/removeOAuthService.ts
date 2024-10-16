import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Settings } from '@rocket.chat/models';
import { capitalize } from '@rocket.chat/string-helpers';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { notifyOnSettingChangedById } from '../lib/notifyListener';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		removeOAuthService(name: string): Promise<void>;
	}
}

Meteor.methods<ServerMethods>({
	async removeOAuthService(name) {
		check(name, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeOAuthService',
			});
		}

		if ((await hasPermissionAsync(userId, 'add-oauth-service')) !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'removeOAuthService' });
		}

		name = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
		name = capitalize(name);

		const settingsIds = [
			`Accounts_OAuth_Custom-${name}`,
			`Accounts_OAuth_Custom-${name}-url`,
			`Accounts_OAuth_Custom-${name}-token_path`,
			`Accounts_OAuth_Custom-${name}-identity_path`,
			`Accounts_OAuth_Custom-${name}-authorize_path`,
			`Accounts_OAuth_Custom-${name}-scope`,
			`Accounts_OAuth_Custom-${name}-access_token_param`,
			`Accounts_OAuth_Custom-${name}-token_sent_via`,
			`Accounts_OAuth_Custom-${name}-identity_token_sent_via`,
			`Accounts_OAuth_Custom-${name}-id`,
			`Accounts_OAuth_Custom-${name}-secret`,
			`Accounts_OAuth_Custom-${name}-button_label_text`,
			`Accounts_OAuth_Custom-${name}-button_label_color`,
			`Accounts_OAuth_Custom-${name}-button_color`,
			`Accounts_OAuth_Custom-${name}-login_style`,
			`Accounts_OAuth_Custom-${name}-key_field`,
			`Accounts_OAuth_Custom-${name}-username_field`,
			`Accounts_OAuth_Custom-${name}-email_field`,
			`Accounts_OAuth_Custom-${name}-name_field`,
			`Accounts_OAuth_Custom-${name}-avatar_field`,
			`Accounts_OAuth_Custom-${name}-roles_claim`,
			`Accounts_OAuth_Custom-${name}-merge_roles`,
			`Accounts_OAuth_Custom-${name}-roles_to_sync`,
			`Accounts_OAuth_Custom-${name}-merge_users`,
			`Accounts_OAuth_Custom-${name}-show_button`,
			`Accounts_OAuth_Custom-${name}-groups_claim`,
			`Accounts_OAuth_Custom-${name}-channels_admin`,
			`Accounts_OAuth_Custom-${name}-map_channels`,
			`Accounts_OAuth_Custom-${name}-groups_channel_map`,
			`Accounts_OAuth_Custom-${name}-merge_users_distinct_services`,
		];

		const promises = settingsIds.map((id) => Settings.removeById(id));

		(await Promise.all(promises)).forEach((value, index) => {
			if (value?.deletedCount) {
				void notifyOnSettingChangedById(settingsIds[index], 'removed');
			}
		});
	},
});
