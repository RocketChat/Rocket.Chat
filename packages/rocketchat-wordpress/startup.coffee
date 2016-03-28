RocketChat.settings.addGroup 'OAuth', ->
	@section 'WordPress', ->
		enableQuery = {_id: 'Accounts_OAuth_Wordpress', value: true}
		@add 'Accounts_OAuth_Wordpress', false, { type: 'boolean', public: true }
		@add 'API_Wordpress_URL', '', { type: 'string', enableQuery: enableQuery, public: true }
		@add 'Accounts_OAuth_Wordpress_id', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_Wordpress_secret', '', { type: 'string', enableQuery: enableQuery }
		@add 'Accounts_OAuth_Wordpress_callback_url', '_oauth/wordpress', { type: 'relativeUrl', readonly: true, force: true, enableQuery: enableQuery }

