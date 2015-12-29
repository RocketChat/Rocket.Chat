Meteor.publish 'permissions', ->
	return RocketChat.models.Permissions.find {}
