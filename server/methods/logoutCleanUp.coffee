Meteor.methods
	logoutCleanUp: (user) ->
		console.log '[methods] logoutCleanUp -> '.green, 'userId:', user._id

		Meteor.defer ->

			RocketChat.callbacks.run 'afterLogoutCleanUp', user