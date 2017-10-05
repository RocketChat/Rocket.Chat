RocketChat.settings.addGroup('OAuth', function() {
	return this.section('WordPress', function() {

		const enableQuery = {
			_id: 'Accounts_OAuth_Wordpress',
			value: true
		};
		this.add('Accounts_OAuth_Wordpress', false, {
			type: 'boolean',
			'public': true
		});
		this.add('API_Wordpress_URL', '', {
			type: 'string',
			enableQuery,
			'public': true
		});
		this.add('Accounts_OAuth_Wordpress_id', '', {
			type: 'string',
			enableQuery
		});
		this.add('Accounts_OAuth_Wordpress_secret', '', {
			type: 'string',
			enableQuery
		});
		return this.add('Accounts_OAuth_Wordpress_callback_url', '_oauth/wordpress', {
			type: 'relativeUrl',
			readonly: true,
			force: true,
			enableQuery
		});
	});
});
