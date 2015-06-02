Meteor.methods
	setAvatarFromService: (image, service) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, '[methods] typingStatus -> Usuário não logado'

		user = Meteor.user()

		file = new FS.File image
		file.attachData image, ->
			file.name user.username

			Avatars.insert file, (err, fileObj) ->
				Meteor.users.update {_id: user._id}, {$set: {avatarOrigin: service}}


	resetAvatar: (image, service) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, '[methods] typingStatus -> Usuário não logado'

		user = Meteor.user()

		Avatars.remove {'copies.avatars.name': user.username}

		Meteor.users.update user._id, {$unset: {avatarOrigin: 1}}
