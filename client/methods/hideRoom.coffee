Meteor.methods
	hideRoom: (rid) ->
		if not Meteor.userId()
			return false

		ChatSubscription.update
			rid: rid
			'u._id': Meteor.userId()
		,
			$set:
				alert: false
				open: false
