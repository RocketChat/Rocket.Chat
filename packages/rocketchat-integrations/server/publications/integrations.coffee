Meteor.publish 'integrations', ->
	unless @userId
		return @ready()

	if RocketChat.authz.hasPermission @userId, 'manage-integrations'
		return RocketChat.models.Integrations.find()
	else if RocketChat.authz.hasPermission @userId, 'manage-own-integrations'
		return RocketChat.models.Integrations.find({"_createdBy._id": @userId})
	else
		throw new Meteor.Error "not-authorized"
