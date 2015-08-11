@getAvatarSuggestionForUser = (user) ->
	avatars = []

	if user.services.facebook?.id?
		avatars.push
			service: 'facebook'
			url: "https://graph.facebook.com/#{user.services.facebook.id}/picture?type=large"

	if user.services.google?.picture? and user.services.google.picture isnt "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg"
		avatars.push
			service: 'google'
			url: user.services.google.picture

	if user.services.github?.username?
		avatars.push
			service: 'github'
			url: "https://avatars.githubusercontent.com/#{user.services.github.username}?s=200"

	if user.services.linkedin?.pictureUrl?
		avatars.push
			service: 'linkedin'
			url: user.services.linkedin.pictureUrl

	if user.emails?.length > 0
		for email in user.emails when email.verified is true
			avatars.push
				service: 'gravatar'
				url: Gravatar.imageUrl(email.address, {default: '404', size: 200, secure: true})

		for email in user.emails when email.verified isnt true
			avatars.push
				service: 'gravatar'
				url: Gravatar.imageUrl(email.address, {default: '404', size: 200, secure: true})

	validAvatars = {}
	for avatar in avatars
		try
			result = HTTP.get avatar.url, npmRequestOptions: {encoding: 'binary'}
			if result.statusCode is 200
				blob = "data:#{result.headers['content-type']};base64," 
				blob += Buffer(result.content, 'binary').toString('base64')
				avatar.blob = blob
				avatar.contentType = result.headers['content-type']
				validAvatars[avatar.service] = avatar
		catch e
			# ...

	return validAvatars


Meteor.methods
	getAvatarSuggestion: ->
		if not Meteor.userId()
			throw new Meteor.Error 203, '[methods] getAvatarSuggestion -> Usuário não logado'

		user = Meteor.user()

		getAvatarSuggestionForUser user
