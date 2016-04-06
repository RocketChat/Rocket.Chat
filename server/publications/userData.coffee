Meteor.publish 'userData', ->
	unless this.userId
		return this.ready()

	RocketChat.models.Users.find this.userId,
		fields:
			name: 1
			username: 1
			status: 1
			statusDefault: 1
			statusConnection: 1
			avatarOrigin: 1
			utcOffset: 1
			language: 1
			settings: 1
			defaultRoom: 1
			'services.github.id': 1
			'services.gitlab.id': 1
			requirePasswordChange: 1
			requirePasswordChangeReason: 1
			'services.password.bcrypt': 1
