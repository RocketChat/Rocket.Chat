import type { OAuthConfiguration } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import passport from 'passport';
import _ from 'underscore';

import { addPassportCustomOAuth } from '../../../server/lib/oauth/addPassportCustomOAuth';
import { CustomOAuth } from '../../custom-oauth/server/custom_oauth_server';
import { settings } from '../../settings/server';

const config: Partial<OAuthConfiguration> = {
	serverURL: '',
	identityPath: '/oauth/me',

	addAutopublishFields: {
		forLoggedInUser: ['services.wordpress'],
		forOtherUsers: ['services.wordpress.user_login'],
	},
	accessTokenParam: 'access_token',
};

const serviceKey = 'wordpress';

const WordPress = new CustomOAuth(serviceKey, config);

const fillSettings = _.debounce(async (): Promise<void> => {
	config.serverURL = settings.get('API_Wordpress_URL');
	if (!config.serverURL) {
		if (config.serverURL === undefined) {
			return fillSettings();
		}
		return;
	}

	passport.unuse(serviceKey);

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
			config.identityTokenSentVia = 'header' as OAuthConfiguration['identityTokenSentVia'];
			config.authorizePath = 'https://public-api.wordpress.com/oauth2/authorize';
			config.tokenPath = 'https://public-api.wordpress.com/oauth2/token';
			config.scope = 'auth';
			break;
		default:
			config.identityPath = '/oauth/me';
			break;
	}

	const clientId = settings.get<string>('Accounts_OAuth_Wordpress_id');
	const clientSecret = settings.get<string>('Accounts_OAuth_Wordpress_secret');

	if (!clientId || !clientSecret) {
		return;
	}

	const completeConfig = { ...config, clientId, clientSecret };

	if (settings.get<boolean>('Accounts_OAuth_Use_Modern_Flow')) {
		addPassportCustomOAuth(serviceKey, completeConfig);
	} else {
		WordPress.configure(completeConfig);
	}

	const enabled = settings.get('Accounts_OAuth_Wordpress');
	if (enabled) {
		await ServiceConfiguration.configurations.upsertAsync(
			{
				service: serviceKey,
			},
			{
				$set: config,
			},
		);
	} else {
		await ServiceConfiguration.configurations.removeAsync({
			service: serviceKey,
		});
	}
}, 1000);

Meteor.startup(() => {
	settings.watchByRegex(/(API\_Wordpress\_URL)?(Accounts\_OAuth\_Wordpress\_)?/, () => fillSettings());
	settings.watch('Accounts_OAuth_Use_Modern_Flow', () => fillSettings());
});
