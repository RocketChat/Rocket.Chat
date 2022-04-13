import { capitalize } from '@rocket.chat/string-helpers';
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { hasPermission } from '../../../authorization/server';
import { Settings } from '../../../models/server/raw';

Meteor.methods({
	async removeOAuthService(name) {
		check(name, String);

		const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'removeOAuthService',
			});
		}

		if (hasPermission(userId, 'add-oauth-service') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'removeOAuthService' });
		}

		name = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
		name = capitalize(name);
		await Promise.all([
			Settings.removeById(`Accounts_OAuth_Custom-${name}`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-url`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-token_path`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-identity_path`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-authorize_path`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-scope`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-access_token_param`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-token_sent_via`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-identity_token_sent_via`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-id`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-secret`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-button_label_text`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-button_label_color`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-button_color`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-login_style`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-key_field`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-username_field`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-email_field`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-name_field`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-avatar_field`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-roles_claim`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-merge_roles`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-roles_to_sync`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-merge_users`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-show_button`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-groups_claim`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-channels_admin`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-map_channels`),
			Settings.removeById(`Accounts_OAuth_Custom-${name}-groups_channel_map`),
		]);
	},
});
