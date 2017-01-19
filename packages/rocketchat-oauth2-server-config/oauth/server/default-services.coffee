if not RocketChat.models.OAuthApps.findOne('zapier')
	RocketChat.models.OAuthApps.insert
		_id: 'zapier'
		name: 'Zapier'
		active: true
		clientId: 'zapier'
		clientSecret: 'RTK6TlndaCIolhQhZ7_KHIGOKj41RnlaOq_o-7JKwLr'
		redirectUri: 'https://zapier.com/dashboard/auth/oauth/return/App32270API/'
		_createdAt: new Date
		_createdBy:
			_id: 'system'
			username: 'system'
