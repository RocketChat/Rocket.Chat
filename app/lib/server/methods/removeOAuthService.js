import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { hasPermission } from '../../../authorization';
import { settings } from '../../../settings';
import s from 'underscore.string';

Meteor.methods({
	removeOAuthService(name) {

		check(name, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'removeOAuthService' });
		}

		if (hasPermission(Meteor.userId(), 'add-oauth-service') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'removeOAuthService' });
		}

		name = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
		name = s.capitalize(name);
		settings.removeById(`Accounts_OAuth_Custom-${ name }`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-url`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-token_path`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-identity_path`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-authorize_path`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-scope`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-token_sent_via`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-identity_token_sent_via`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-id`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-secret`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-button_label_text`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-button_label_color`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-button_color`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-login_style`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-username_field`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-avatar_field`);
		settings.removeById(`Accounts_OAuth_Custom-${ name }-merge_users`);
	},
});
