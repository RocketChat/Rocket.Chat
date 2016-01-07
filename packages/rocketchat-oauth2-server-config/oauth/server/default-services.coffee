if not RocketChat.models.OAuthApps.findOne('default-zapier')
	RocketChat.models.OAuthApps.insert
		_id: 'default-zapier'
		name: 'Default: Zapier'
		active: false
		default: true
		clientId: 'default-zapier'
		clientSecret: 'RTK6TlndaCIolhQhZ7_KHIGOKj41RnlaOq_o-7JKwLr'
		redirectUri: 'https://zapier.com/dashboard/auth/oauth/return/AppIDAPI/'
		_createdAt: new Date
		_createdBy:
			_id: 'system'
			username: 'system'
