Template.integrationsIncoming.helpers

	hasPermission: ->
		return RocketChat.authz.hasAllPermission 'manage-integrations'

	data: ->
		return {} =
			channelType: 'c'
