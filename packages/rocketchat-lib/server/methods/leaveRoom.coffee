Meteor.methods
	leaveRoom: (rid) ->

		check rid, String

		unless Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'leaveRoom' })

		this.unblock()

		fromId = Meteor.userId()
		room = RocketChat.models.Rooms.findOneById rid
		user = Meteor.user()
		
		if room.t is 'd'
			throw new Meteor.Error 'error-not-allowed', 'Not allowed', { method: 'leaveRoom' } 

		# If user is room owner, check if there are other owners. If there isn't anyone else, warn user to set a new owner.
		if RocketChat.authz.hasRole(user._id, 'owner', room._id)
			numOwners = RocketChat.authz.getUsersInRole('owner', room._id).fetch().length
			if numOwners is 1
				throw new Meteor.Error 'error-you-are-last-owner', 'You are the last owner. Please set new owner before leaving the room.', { method: 'leaveRoom' }

		RocketChat.removeUserFromRoom(rid, Meteor.user());
