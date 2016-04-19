Meteor.publish 'integrations', ->
	unless @userId
		return @ready()

	if not RocketChat.authz.hasPermission @userId, 'manage-integrations'
		return @ready()

	return RocketChat.models.Integrations.find()
