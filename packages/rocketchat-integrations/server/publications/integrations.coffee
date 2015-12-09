Meteor.publish 'integrations', ->
	unless @userId
		return @ready()

	if not RocketChat.authz.hasPermission @userId, 'manage-integrations'
		throw new Meteor.Error "not-authorized"

	return RocketChat.models.Integrations.find()
