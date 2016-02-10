RocketChat.Migrations.add
	version: 2
	up: ->
		RocketChat.models.Users.find({avatarOrigin: {$exists: false}, username: {$exists: true}}).forEach (user) ->
			avatars = getAvatarSuggestionForUser user

			services = Object.keys avatars

			if services.length is 0
				return

			service = services[0]
			console.log user.username, '->', service

			dataURI = avatars[service].blob

			{image, contentType} = RocketChatFile.dataURIParse dataURI

			rs = RocketChatFile.bufferToStream new Buffer(image, 'base64')
			ws = RocketChatFileAvatarInstance.createWriteStream "#{user.username}.jpg", contentType
			ws.on 'end', Meteor.bindEnvironment ->
				RocketChat.models.Users.setAvatarOrigin user._id, service

			rs.pipe(ws)
