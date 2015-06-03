Meteor.methods
	setAvatarFromService: (dataURI, service) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, '[methods] typingStatus -> Usuário não logado'

		user = Meteor.user()

		{image, contentType} = RocketFile.dataURIParse dataURI

		rs = RocketFile.bufferToStream new Buffer(image, 'base64')
		ws = RocketFileAvatarInstance.createWriteStream "#{user.username}.jpg", contentType
		ws.on 'end', Meteor.bindEnvironment ->
			Meteor.users.update {_id: user._id}, {$set: {avatarOrigin: service}}

		rs.pipe(ws)
		return


	resetAvatar: (image, service) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, '[methods] typingStatus -> Usuário não logado'

		user = Meteor.user()

		RocketFileAvatarInstance.deleteFile "#{user.username}.jpg"

		Meteor.users.update user._id, {$unset: {avatarOrigin: 1}}
		return
