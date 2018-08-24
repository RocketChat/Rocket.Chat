RocketChat.settings.addGroup('OAuth', function() {
	this.section('WeChat', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_WeChat',
			value: true,
		};

		const persistent = true;

		this.add('Accounts_OAuth_WeChat', false, { type: 'boolean', public: true, persistent });
		this.add('Accounts_OAuth_WeChat_URL', '', { type: 'string', enableQuery, public: true, persistent });
		this.add('Accounts_OAuth_WeChat_id', '', { type: 'string', enableQuery, persistent });
		this.add('Accounts_OAuth_WeChat_secret', '', { type: 'string', enableQuery });

		this.add('Accounts_OAuth_WeChat_token_path', '/oauth/token', { type: 'string', persistent });
		this.add('Accounts_OAuth_WeChat_token_sent_via', 'payload', { type: 'select', persistent, values: [{ key: 'header', i18nLabel: 'Header' }, { key: 'payload', i18nLabel: 'Payload' }] });
		this.add('Accounts_OAuth_WeChat_identity_token_sent_via', 'default', { type: 'select', persistent, values: [{ key: 'default', i18nLabel: 'Same_As_Token_Sent_Via' }, { key: 'header', i18nLabel: 'Header' }, { key: 'payload', i18nLabel: 'Payload' }] });
		this.add('Accounts_OAuth_WeChat_identity_path', '/me', { type: 'string', persistent });
		this.add('Accounts_OAuth_WeChat_authorize_path', '/oauth/authorize', { type: 'string', persistent });
		this.add('Accounts_OAuth_WeChat_scope', 'openid', { type: 'string', persistent });

		this.add('Accounts_OAuth_WeChat_username_field', '', { type: 'string', persistent });
		this.add('Accounts_OAuth_WeChat_merge_users', false, { type: 'boolean', persistent });
	});
});
