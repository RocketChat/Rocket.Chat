Meteor.methods
	setAvatarFromService: (dataURI, service) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, '[methods] typingStatus -> Usuário não logado'

		user = Meteor.user()

		{image, contentType} = RocketFile.dataURIParse dataURI

		rs = RocketFile.bufferToStream new Buffer(image, 'base64')
		ws = RocketFileInstance.createWriteStream user.username, contentType
		rs.pipe(ws)
		rs.on 'error', ->
			console.log arguments

		# file = new FS.File image
		# file.attachData image, ->
		# 	file.name user.username

		# 	Avatars.insert file, (err, fileObj) ->
		# 		Meteor.users.update {_id: user._id}, {$set: {avatarOrigin: service}}


	resetAvatar: (image, service) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, '[methods] typingStatus -> Usuário não logado'

		user = Meteor.user()

		Avatars.remove {'copies.avatars.name': user.username}

		Meteor.users.update user._id, {$unset: {avatarOrigin: 1}}
