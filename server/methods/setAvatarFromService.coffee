Meteor.methods
	setAvatarFromService: (dataURI, contentType, service) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] setAvatarFromService -> Invalid user")

		console.log '[methods] setAvatarFromService -> '.green, 'userId:', Meteor.userId(), 'contentType:', contentType, 'service:', service

		user = Meteor.user()

		if service is 'initials'
			Meteor.users.update {_id: user._id}, {$set: {avatarOrigin: service}}
			return

		{image, contentType} = RocketChatFile.dataURIParse dataURI

		rs = RocketChatFile.bufferToStream new Buffer(image, 'base64')
		ws = RocketChatFileAvatarInstance.createWriteStream "#{user.username}.jpg", contentType
		ws.on 'end', Meteor.bindEnvironment ->
			Meteor.setTimeout ->
				Meteor.users.update {_id: user._id}, {$set: {avatarOrigin: service}}
				RocketChat.Notifications.notifyAll 'updateAvatar', {username: user.username}
			, 500

		rs.pipe(ws)
		return
