Template.userCard.helpers
	userData: ->
		uid = Session.get('userProfileActive')

		userData = {
			name: Session.get('user_' + uid + '_name')
			emails: Session.get('user_' + uid + '_emails')
			uid: uid
		}
		phone = Session.get('user_' + uid + '_phone')
		if phone? and phone[0]?.phoneNumber
			userData.phone = phone[0]?.phoneNumber

		return userData

	canManageRoom: ->
		Tracker.nonreactive ->
			return false unless Router.current().params._id?

			roomData = Session.get('roomData' + Router.current().params._id)

			return false unless roomData?

			return roomData.uid is Meteor.userId() and not Session.equals('userProfileActive', Meteor.userId())

Template.userCard.events
	'click .private-chat': (event) ->
		Meteor.call 'createDirectRoom', Session.get('userProfileActive'), (error, result) ->
			if error
				return Errors.throw error.reason

			if result.rid?
				Router.go('room', { _id: result.rid })

	'click .remove-user': (event) ->
		Meteor.call 'removeUserFromRoom', { rid: Router.current().params._id, uid: Session.get('userProfileActive') }, (error, result) ->
			if error
				return Errors.throw error.reason
