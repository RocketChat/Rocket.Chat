RocketChat.authz.subscription = Meteor.subscribe 'permissions'

RocketChat.AdminBox.addOption
	href: 'rocket-permissions'
	i18nLabel: 'Permissions'
	permissionGranted: ->
		return RocketChat.authz.hasAllPermission('access-rocket-permissions')
