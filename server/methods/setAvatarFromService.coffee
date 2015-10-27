Meteor.methods
	setAvatarFromService: (dataURI, contentType, service) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] setAvatarFromService -> Invalid user")

		console.log '[methods] setAvatarFromService -> '.green, 'userId:', Meteor.userId(), 'contentType:', contentType, 'service:', service

		user = Meteor.user()

		if service is 'initials'
			RocketChat.models.Users.setAvatarOrigin user._id, service
			return

		if service is 'url'
			headReq = request.headSync dataURI

			if headReq.response.statusCode != 200
				console.log "Not a valid response, #{headReq.response.statusCode}, from the avatar url:", dataURI
				throw new Meteor.Error('invalid-avatar-url', '[methods] setAvatarFromService -> url service -> error on checking the image type')

			if headReq.response.headers['content-type'] isnt 'image/jpeg'
				throw new Meteor.Error('invalid-image-url', '[methods] setAvatarFromService -> url service -> Invalid url, it is not a jpeg')

			image = request.getSync dataURI, { encoding: null }
			ars = RocketChatFile.bufferToStream image.body
			aws = RocketChatFileAvatarInstance.createWriteStream "#{user.username}.jpg", headReq.response.headers['content-type']
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
