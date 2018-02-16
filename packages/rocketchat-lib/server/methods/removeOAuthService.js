import s from 'underscore.string';

Meteor.methods({
	removeOAuthService(name) {

		check(name, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'removeOAuthService' });
		}

		if (RocketChat.authz.hasPermission(Meteor.userId(), 'add-oauth-service') !== true) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'removeOAuthService' });
		}

		name = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
		name = s.capitalize(name);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-url`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-token_path`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-identity_path`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-authorize_path`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-scope`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-token_sent_via`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-identity_token_sent_via`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-id`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-secret`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-button_label_text`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-button_label_color`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-button_color`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-login_style`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-username_field`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-avatar_field`);
		RocketChat.settings.removeById(`Accounts_OAuth_Custom-${ name }-merge_users`);
	}
});
