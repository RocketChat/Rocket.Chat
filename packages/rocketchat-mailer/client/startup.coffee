RocketChat.AdminBox.addOption
	href: 'rocket-mailer'
	i18nLabel: 'Rocket_Mailer'
	permissionGranted: ->
		return RocketChat.authz.hasAllPermission('access-rocket-mailer')
