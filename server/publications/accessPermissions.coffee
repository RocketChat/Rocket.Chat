Meteor.publish 'accessPermissions', ->
	unless this.userId
		return this.ready()

	console.log '[publish] accessPermissions'.green

	return AccessPermissions.find()