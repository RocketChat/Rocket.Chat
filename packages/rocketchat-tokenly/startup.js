RocketChat.settings.addGroup('OAuth', function() {
	this.section('Tokenly', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_Tokenly',
			value: true
		};

		this.add('Accounts_OAuth_Tokenly', false, { type: 'boolean' });
		this.add('API_Tokenly_URL', '', { type: 'string', public: true, enableQuery, i18nDescription: 'API_Tokenly_URL_Description' });
		this.add('Accounts_OAuth_Tokenly_id', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Tokenly_secret', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_Tokenly_callback_url', '_oauth/tokenly', { type: 'relativeUrl', readonly: true, force: true, enableQuery });
	});
});
