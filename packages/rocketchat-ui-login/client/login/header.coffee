Template.loginHeader.helpers
	logoUrl: ->
		asset = RocketChat.settings.get('Assets_logo')
		prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || ''
		if asset?
			return prefix + '/' + (asset.url or asset.defaultUrl)
