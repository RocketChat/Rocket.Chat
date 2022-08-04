import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { settings, settingsRegistry } from '../../settings/server';
import { config, WordPress } from '../lib/common';

settingsRegistry.addGroup('OAuth', function () {
	return this.section('WordPress', function () {
		const enableQuery = {
			_id: 'Accounts_OAuth_Wordpress',
			value: true,
		};
		this.add('Accounts_OAuth_Wordpress', false, {
			type: 'boolean',
			public: true,
		});
		this.add('API_Wordpress_URL', '', {
			type: 'string',
			enableQuery,
			public: true,
			secret: true,
		});
		this.add('Accounts_OAuth_Wordpress_id', '', {
			type: 'string',
			enableQuery,
		});
		this.add('Accounts_OAuth_Wordpress_secret', '', {
			type: 'string',
			enableQuery,
			secret: true,
		});
		this.add('Accounts_OAuth_Wordpress_server_type', '', {
			type: 'select',
			enableQuery,
			public: true,
			values: [
				{
					key: 'wordpress-com',
					i18nLabel: 'Accounts_OAuth_Wordpress_server_type_wordpress_com',
				},
				{
					key: 'wp-oauth-server',
					i18nLabel: 'Accounts_OAuth_Wordpress_server_type_wp_oauth_server',
				},
				{
					key: 'custom',
					i18nLabel: 'Accounts_OAuth_Wordpress_server_type_custom',
				},
			],
			i18nLabel: 'Server_Type',
		});

		const customOAuthQuery = [
			{
				_id: 'Accounts_OAuth_Wordpress',
				value: true,
			},
			{
				_id: 'Accounts_OAuth_Wordpress_server_type',
				value: 'custom',
			},
		];

		this.add('Accounts_OAuth_Wordpress_identity_path', '', {
			type: 'string',
			enableQuery: customOAuthQuery,
			public: true,
		});
		this.add('Accounts_OAuth_Wordpress_identity_token_sent_via', '', {
			type: 'string',
			enableQuery: customOAuthQuery,
			public: true,
		});
		this.add('Accounts_OAuth_Wordpress_token_path', '', {
			type: 'string',
			enableQuery: customOAuthQuery,
			public: true,
		});
		this.add('Accounts_OAuth_Wordpress_authorize_path', '', {
			type: 'string',
			enableQuery: customOAuthQuery,
			public: true,
		});
		this.add('Accounts_OAuth_Wordpress_scope', '', {
			type: 'string',
			enableQuery: customOAuthQuery,
			public: true,
		});
		return this.add('Accounts_OAuth_Wordpress_callback_url', '_oauth/wordpress', {
			type: 'relativeUrl',
			readonly: true,
			enableQuery,
		});
	});
});

const fillSettings = _.debounce(
	Meteor.bindEnvironment(() => {
		config.serverURL = settings.get('API_Wordpress_URL');
		if (!config.serverURL) {
			if (config.serverURL === undefined) {
				fillSettings();
				return;
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

		WordPress.configure(config);
		if (Meteor.isServer) {
			const enabled = settings.get('Accounts_OAuth_Wordpress');
			if (enabled) {
				ServiceConfiguration.configurations.upsert(
					{
						service: 'wordpress',
					},
					{
						$set: config,
					},
				);
			} else {
				ServiceConfiguration.configurations.remove({
					service: 'wordpress',
				});
			}
		}
	}),
	1000,
);

Meteor.startup(() => {
	settings.watchByRegex(/(API\_Wordpress\_URL)?(Accounts\_OAuth\_Wordpress\_)?/, () => fillSettings());
});
