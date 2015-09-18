Meteor.publish 'permissions', ->
	console.log '[publish] permissions'.green
	return ChatPermissions.find {} 