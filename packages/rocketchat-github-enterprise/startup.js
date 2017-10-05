RocketChat.settings.addGroup('OAuth', function() {
	this.section('GitHub Enterprise', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_GitHub_Enterprise',
			value: true
		};

		this.add('Accounts_OAuth_GitHub_Enterprise', false, { type: 'boolean' });
		this.add('API_GitHub_Enterprise_URL', '', { type: 'string', public: true, enableQuery, i18nDescription: 'API_GitHub_Enterprise_URL_Description' });
		this.add('Accounts_OAuth_GitHub_Enterprise_id', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_GitHub_Enterprise_secret', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_GitHub_Enterprise_callback_url', '_oauth/github_enterprise', { type: 'relativeUrl', readonly: true, force: true, enableQuery });
	});
});
