Meteor.methods
	createPrivateGroup: (name, members) ->

		check name, String
		check members, Match.Optional([String])

		if not Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', "Invalid user", { method: 'createPrivateGroup' }

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'create-p')
			throw new Meteor.Error 'error-not-allowed', "Not allowed", { method: 'createPrivateGroup' }

		return RocketChat.createRoom('p', name, Meteor.user()?.username, members);
