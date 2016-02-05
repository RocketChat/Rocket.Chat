Template.integrationsNew.helpers
	hasPermission: ->
		return RocketChat.authz.hasAllPermission 'manage-integrations'
