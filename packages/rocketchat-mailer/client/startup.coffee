RocketChat.AdminBox.addOption
	href: 'mailer'
	i18nLabel: 'Mailer'
	permissionGranted: ->
		return RocketChat.authz.hasAllPermission('access-mailer')
