import type { OauthConfig } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import _ from 'underscore';

import { CustomOAuth } from '../../custom-oauth/server/custom_oauth_server';
import { settings } from '../../settings/server';

const config: OauthConfig = {
	serverURL: '',
	identityPath: '/oauth/me',

	addAutopublishFields: {
		forLoggedInUser: ['services.wordpress'],
		forOtherUsers: ['services.wordpress.user_login'],
	},
	accessTokenParam: 'access_token',
};

const WordPress = new CustomOAuth('wordpress', config);

const fillSettings = _.debounce(async (): Promise<void> => {
	config.serverURL = settings.get('API_Wordpress_URL');
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

	const serverType = settings.get('Accounts_OAuth_Wordpress_server_type');
	switch (serverType) {
		case 'custom':
			if (settings.get('Accounts_OAuth_Wordpress_identity_path')) {
				config.identityPath = settings.get('Accounts_OAuth_Wordpress_identity_path');
			}

			if (settings.get('Accounts_OAuth_Wordpress_identity_token_sent_via')) {
				config.identityTokenSentVia = settings.get('Accounts_OAuth_Wordpress_identity_token_sent_via');
			}

			if (settings.get('Accounts_OAuth_Wordpress_token_path')) {
				config.tokenPath = settings.get('Accounts_OAuth_Wordpress_token_path');
			}

			if (settings.get('Accounts_OAuth_Wordpress_authorize_path')) {
				config.authorizePath = settings.get('Accounts_OAuth_Wordpress_authorize_path');
			}

			if (settings.get('Accounts_OAuth_Wordpress_scope')) {
				config.scope = settings.get('Accounts_OAuth_Wordpress_scope');
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
	const enabled = settings.get('Accounts_OAuth_Wordpress');
	if (enabled) {
		await ServiceConfiguration.configurations.upsertAsync(
			{
				service: 'wordpress',
			},
			{
				$set: config,
			},
		);
	} else {
		await ServiceConfiguration.configurations.removeAsync({
			service: 'wordpress',
		});
	}

	return result;
}, 1000);

Meteor.startup(() => {
	return settings.watchByRegex(/(API\_Wordpress\_URL)?(Accounts\_OAuth\_Wordpress\_)?/, () => fillSettings());
});
