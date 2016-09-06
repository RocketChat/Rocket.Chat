RocketChat.settings.addGroup 'OAuth', ->
	@section 'GitHub Enterprise', ->
		enableQuery = {_id: 'Accounts_OAuth_GitHub_Enterprise', value: true}
		@add 'Accounts_OAuth_GitHub_Enterprise', false, {type: 'boolean'}
		@add 'API_GitHub_Enterprise_URL', '', { type: 'string', public: true, enableQuery: enableQuery, i18nDescription: 'API_GitHub_Enterprise_URL_Description' }
		@add 'Accounts_OAuth_GitHub_Enterprise_id', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_GitHub_Enterprise_secret', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_GitHub_Enterprise_callback_url', '_oauth/github_enterprise', { type: 'relativeUrl', readonly: true, force: true, enableQuery: enableQuery }
