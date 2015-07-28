Meteor.methods
	updatePrivateGroup: (rid, name, members, accessPermissions) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] createPrivateGroup -> Invalid user"

		console.log '[methods] updatePrivateGroup -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		now = new Date()

		me = Meteor.user()

		members.push me.username

		name = s.slugify name

		return {
			rid: rid
		}
