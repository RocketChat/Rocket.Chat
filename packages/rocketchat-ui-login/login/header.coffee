Template.loginHeader.helpers

	logoUrl: ->
		asset = RocketChat.settings.get('Assets_logo')
		if asset?
			return asset.url or asset.defaultUrl

	showLogo: ->
		return RocketChat.settings.get 'Login_Show_Logo'

