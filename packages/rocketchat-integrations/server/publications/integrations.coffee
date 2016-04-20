Meteor.publish 'integrations', ->
	unless @userId
		return @ready()

	if not RocketChat.authz.hasPermission @userId, 'manage-integrations'
		return @error new Meteor.Error "error-not-allowed", "Not allowed", { publish: 'integrations' }
		return @ready()

	return RocketChat.models.Integrations.find()
