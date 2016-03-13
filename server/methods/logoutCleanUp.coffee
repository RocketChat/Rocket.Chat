Meteor.methods
	logoutCleanUp: (user) ->
		Meteor.defer ->

			RocketChat.callbacks.run 'afterLogoutCleanUp', user
