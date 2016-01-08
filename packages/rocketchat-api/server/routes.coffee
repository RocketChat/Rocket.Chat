RocketChat.API.v1.addRoute 'info', authRequired: false,
	get: -> RocketChat.Info


RocketChat.API.v1.addRoute 'me', authRequired: true,
	get: ->
		return _.pick @user, [
			'_id'
			'name'
			'emails'
			'status'
			'statusConnection'
			'username'
			'utcOffset'
			'active'
			'language'
		]
