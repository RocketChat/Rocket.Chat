@getAvatarSuggestionForUser = (user) ->
	avatars = []

	if user.services.facebook?.id? and RocketChat.settings.get 'Accounts_OAuth_Facebook'
		avatars.push
			service: 'facebook'
			url: "https://graph.facebook.com/#{user.services.facebook.id}/picture?type=large"

	if user.services.google?.picture? and user.services.google.picture isnt "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg" and RocketChat.settings.get 'Accounts_OAuth_Google'
		avatars.push
			service: 'google'
			url: user.services.google.picture

	if user.services.github?.username? and RocketChat.settings.get 'Accounts_OAuth_Github'
		avatars.push
			service: 'github'
			url: "https://avatars.githubusercontent.com/#{user.services.github.username}?s=200"

	if user.services.linkedin?.pictureUrl? and RocketChat.settings.get 'Accounts_OAuth_Linkedin'
		avatars.push
			service: 'linkedin'
			url: user.services.linkedin.pictureUrl

	if user.services.twitter?.profile_image_url_https? and RocketChat.settings.get 'Accounts_OAuth_Twitter'
		avatars.push
			service: 'twitter'
			url: user.services.twitter.profile_image_url_https

	if user.services.gitlab?.avatar_url? and RocketChat.settings.get 'Accounts_OAuth_Gitlab'
		avatars.push
			service: 'gitlab'
			url: user.services.gitlab.avatar_url

	if user.services.sandstorm?.picture? and Meteor.settings.public.sandstorm
		avatars.push
			service: 'sandstorm'
			url: user.services.sandstorm.picture

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
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'getAvatarSuggestion' }

		@unblock()

		user = Meteor.user()

		getAvatarSuggestionForUser user
