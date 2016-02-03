Meteor.publish 'roles', ->
	unless @userId
		return @ready()

	return RocketChat.models.Roles.find()

