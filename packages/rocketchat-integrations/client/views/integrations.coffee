Template.integrations.helpers
	hasPermission: ->
		return RocketChat.authz.hasAllPermission 'manage-integrations'

	integrations: ->
		return ChatIntegrations.find()

	dateFormated: (date) ->
		return moment(date).format('L LT')
