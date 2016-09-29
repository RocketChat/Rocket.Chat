Meteor.methods
	logoutCleanUp: (user) ->

		check user, Object

		Meteor.defer ->

			RocketChat.callbacks.run 'afterLogoutCleanUp', user
