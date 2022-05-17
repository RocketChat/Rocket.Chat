import { settingsRegistry } from '../../settings/server';

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
