Meteor.subscribe 'integrations'

RocketChat.AdminBox.addOption
	href: 'admin-integrations'
	i18nLabel: 'Integrations'
	permissionGranted: ->
		return RocketChat.authz.hasAllPermission('manage-integrations')
