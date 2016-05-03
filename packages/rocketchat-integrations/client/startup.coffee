Meteor.subscribe 'integrations'

RocketChat.AdminBox.addOption
	href: 'admin-integrations'
	i18nLabel: 'Integrations'
	permissionGranted: ->
		return RocketChat.authz.hasAtLeastOnePermission(['manage-integrations', 'manage-own-integrations'])
