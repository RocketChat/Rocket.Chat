RocketChat.authz.subscription = Meteor.subscribe 'permissions'

RocketChat.AdminBox.addOption
	href: 'rocket-permissions'
	i18nLabel: 'Rocket_Permissions'
	permissionGranted: ->
		return RocketChat.authz.hasAllPermission('access-rocket-permissions')
