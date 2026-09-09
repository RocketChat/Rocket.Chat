import { Settings } from '@rocket.chat/models';
import { capitalize } from '@rocket.chat/tools';
import { Meteor } from 'meteor/meteor';

import { notifyOnSettingChangedById } from '../../lib/notifyListener';

export const removeCustomOAuthSettings = async (name: string): Promise<void> => {
	const normalized = capitalize(name.toLowerCase().replace(/[^a-z0-9_]/g, ''));

	if (!normalized) {
		throw new Meteor.Error('error-invalid-name', 'Invalid OAuth service name', { method: 'removeOAuthService' });
	}

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

