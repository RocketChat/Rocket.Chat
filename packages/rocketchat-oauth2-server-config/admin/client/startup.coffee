RocketChat.AdminBox.addOption
	href: 'admin-oauth-apps'
	i18nLabel: 'OAuth Apps'
	permissionGranted: ->
		return RocketChat.authz.hasAllPermission('manage-oauth-apps')
