Meteor.methods
	setAdminStatus: (userId, admin) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] setAdminStatus -> Invalid user"

		unless Meteor.user()?.admin is true
			throw new Meteor.Error 'not-authorized', '[methods] setAdminStatus -> Not authorized'

		Meteor.users.update userId, { $set: { admin: admin } }

		return true
