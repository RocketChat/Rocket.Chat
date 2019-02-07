import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { RocketChat } from 'meteor/rocketchat:lib';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { CustomOAuth } from 'meteor/rocketchat:custom-oauth';
import _ from 'underscore';

const config = {
	serverURL: '',
	identityPath: '/oauth/me',

	addAutopublishFields: {
		forLoggedInUser: ['services.wordpress'],
		forOtherUsers: ['services.wordpress.user_login'],
	},
};

const WordPress = new CustomOAuth('wordpress', config);

const fillSettings = _.debounce(Meteor.bindEnvironment(() => {
	config.serverURL = RocketChat.settings.get('API_Wordpress_URL');
	if (!config.serverURL) {
		if (config.serverURL === undefined) {
			return fillSettings();
		}
		return;
	}

	delete config.identityPath;
	delete config.identityTokenSentVia;
	delete config.authorizePath;
	delete config.tokenPath;
	delete config.scope;

	const serverType = RocketChat.settings.get('Accounts_OAuth_Wordpress_server_type');
	switch (serverType) {
		case 'custom':
			if (RocketChat.settings.get('Accounts_OAuth_Wordpress_identity_path')) {
				config.identityPath = RocketChat.settings.get('Accounts_OAuth_Wordpress_identity_path');
			}

			if (RocketChat.settings.get('Accounts_OAuth_Wordpress_identity_token_sent_via')) {
				config.identityTokenSentVia = RocketChat.settings.get('Accounts_OAuth_Wordpress_identity_token_sent_via');
			}

			if (RocketChat.settings.get('Accounts_OAuth_Wordpress_token_path')) {
				config.tokenPath = RocketChat.settings.get('Accounts_OAuth_Wordpress_token_path');
			}

			if (RocketChat.settings.get('Accounts_OAuth_Wordpress_authorize_path')) {
				config.authorizePath = RocketChat.settings.get('Accounts_OAuth_Wordpress_authorize_path');
			}

			if (RocketChat.settings.get('Accounts_OAuth_Wordpress_scope')) {
				config.scope = RocketChat.settings.get('Accounts_OAuth_Wordpress_scope');
			}
			break;
		case 'wordpress-com':
			config.identityPath = 'https://public-api.wordpress.com/rest/v1/me';
			config.identityTokenSentVia = 'header';
			config.authorizePath = 'https://public-api.wordpress.com/oauth2/authorize';
			config.tokenPath = 'https://public-api.wordpress.com/oauth2/token';
			config.scope = 'auth';
			break;
		default:
			config.identityPath = '/oauth/me';
			break;
	}

	const result = WordPress.configure(config);
	if (Meteor.isServer) {
		const enabled = RocketChat.settings.get('Accounts_OAuth_Wordpress');
		if (enabled) {
			ServiceConfiguration.configurations.upsert({
				service: 'wordpress',
			}, {
				$set: config,
			});
		} else {
			ServiceConfiguration.configurations.remove({
				service: 'wordpress',
			});
		}
	}

	return result;
}), Meteor.isServer ? 1000 : 100);

if (Meteor.isServer) {
	Meteor.startup(function() {
		return RocketChat.settings.get(/(API\_Wordpress\_URL)?(Accounts\_OAuth\_Wordpress\_)?/, () => fillSettings());
	});
} else {
	Meteor.startup(function() {
		return Tracker.autorun(function() {
			return fillSettings();
		});
	});
}
