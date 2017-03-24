RocketChat.settings.addGroup('OAuth', function() {
	this.section('GitLab', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Gitlab',
			value: true
		};

		this.add('Accounts_OAuth_Gitlab', false, { type: 'boolean', public: true });
		this.add('API_Gitlab_URL', '', { type: 'string', enableQuery, public: true });
		this.add('Accounts_OAuth_Gitlab_id', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Gitlab_secret', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Gitlab_callback_url', '_oauth/gitlab', { type: 'relativeUrl', readonly: true, force: true, enableQuery });
	});
});
