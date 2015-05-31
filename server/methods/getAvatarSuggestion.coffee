Meteor.methods
	getAvatarSuggestion: ->
		if not Meteor.userId()
			throw new Meteor.Error 203, '[methods] typingStatus -> Usuário não logado'

		user = Meteor.user()

		avatars = []

		if user.services.facebook?.id?
			avatars.push
				service: 'facebook'
				url: "https://graph.facebook.com/#{user.services.facebook.id}/picture?type=large"

		if user.services.google?.picture?
			avatars.push
				service: 'google'
				url: user.services.google.picture

		if user.services.github?.username?
			avatars.push
				service: 'github'
				url: "https://avatars.githubusercontent.com/#{user.services.github.username}?s=200"

		if user.emails?.length > 0
			for email in user.emails when email.verified is true
				avatars.push
					service: 'gravatar'
					url: Gravatar.imageUrl email.address

		validAvatars = []
		for avatar in avatars
			try
				result = HTTP.get avatar.url, npmRequestOptions: {encoding: null}
				if result.statusCode is 200
					blob = "data:#{result.headers['content-type']};base64,"
					binary = new Buffer(result.content, 'binary')
					blob += binary.toString('base64')
					avatar.blob = blob
					validAvatars.push avatar
			catch e
				# ...

		return validAvatars
