Meteor.methods
	leaveRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('User_logged_out')

		ChatSubscription.remove
			rid: rid
			'u._id': Meteor.userId()

		ChatRoom.update rid,
			$pull:
				usernames: Meteor.user().username

