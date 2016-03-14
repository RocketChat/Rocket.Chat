Meteor.publish 'roles', ->
	return RocketChat.models.Roles.find()

