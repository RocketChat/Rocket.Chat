Meteor.methods
	deleteUser: (userId) ->
		if not Meteor.userId()
			throw new Meteor.Error('invalid-user', "[methods] deleteUser -> Invalid user")
		
		user = Meteor.users.findOne Meteor.userId()
		unless user?.admin is true
			throw new Meteor.Error 'not-authorized', '[methods] deleteUser -> Not authorized'

		return true
		# Meteor.users.remove userId