Meteor.publish 'permissions', ->
	console.log '[publish] permissions'.green
	return RocketChat.models.Permissions.find {}
