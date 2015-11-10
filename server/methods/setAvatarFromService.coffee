Meteor.methods
	setAvatarFromService: (dataURI, contentType, service) ->
		unless Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] setAvatarFromService -> Invalid user")

		unless RocketChat.settings.get("Accounts_AllowUserAvatarChange")
			throw new Meteor.Error(403, "[methods] resetAvatar -> Invalid access")

		console.log '[methods] setAvatarFromService -> '.green, 'userId:', Meteor.userId(), 'contentType:', contentType, 'service:', service

		user = Meteor.user()

		if service is 'initials'
			RocketChat.models.Users.setAvatarOrigin user._id, service
			return

		if service is 'url'
			result = null

			try
				result = HTTP.get dataURI, npmRequestOptions: {encoding: 'binary'}
			catch e
				console.log "Error while handling the setting of the avatar from a url (#{dataURI}) for #{user.username}:", e
				throw new Meteor.Error('avatar-url-http-error', '[methods] setAvatarFromService -> http.get result -> error')

			if result.statusCode isnt 200
				console.log "Not a valid response, #{result.statusCode}, from the avatar url: #{dataURI}"
				throw new Meteor.Error('invalid-avatar-url', '[methods] setAvatarFromService -> url service -> error on getting the avatar from url')

			if not /image\/.+/.test result.headers['content-type']
				console.log "Not a valid content-type from the provided url, #{result.headers['content-type']}, from the avatar url: #{dataURI}"
				throw new Meteor.Error('invalid-avatar-url', '[methods] setAvatarFromService -> url service -> invalid content-type')

			ars = RocketChatFile.bufferToStream new Buffer(result.content, 'binary')
			aws = RocketChatFileAvatarInstance.createWriteStream "#{user.username}.jpg", result.headers['content-type']
			aws.on 'end', Meteor.bindEnvironment ->
				Meteor.setTimeout ->
					console.log "Set #{user.username}'s avatar from the url: #{dataURI}"
					RocketChat.models.Users.setAvatarOrigin user._id, service
					RocketChat.Notifications.notifyAll 'updateAvatar', { username: user.username }
				, 500

			ars.pipe(aws)
			return

		{image, contentType} = RocketChatFile.dataURIParse dataURI

		rs = RocketChatFile.bufferToStream new Buffer(image, 'base64')
		ws = RocketChatFileAvatarInstance.createWriteStream "#{user.username}.jpg", contentType
		ws.on 'end', Meteor.bindEnvironment ->
			Meteor.setTimeout ->
				RocketChat.models.Users.setAvatarOrigin user._id, service
				RocketChat.Notifications.notifyAll 'updateAvatar', {username: user.username}
			, 500

		rs.pipe(ws)
		return

DDPRateLimiter.addRule
	type: 'method'
	name: 'setAvatarFromService'
	userId: -> return true
, 1, 60000
