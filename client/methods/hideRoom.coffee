Meteor.methods
	hideRoom: (rid) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('general.User_logged_out')

		ChatSubscription.update
			rid: rid
		,
			$set:
				alert: false
				open: false
