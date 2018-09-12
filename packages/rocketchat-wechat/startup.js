RocketChat.settings.addGroup('OAuth', function() {
	this.section('WeChat', function() {
		const enableQuery = {
			_id: 'Accounts_OAuth_WeChat',
			value: true,
		};

		const persistent = true;

		this.add('Accounts_OAuth_WeChat', false, { type: 'boolean', public: true, persistent });
		this.add('Accounts_OAuth_WeChat_appid', '', { type: 'string', enableQuery, persistent });
		this.add('Accounts_OAuth_WeChat_appsecret', '', { type: 'string', enableQuery });
		this.add('Accounts_OAuth_WeChat_username_field', 'nickname', { type: 'string', persistent });
	});
});
