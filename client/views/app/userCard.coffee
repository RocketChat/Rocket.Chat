Template.userCard.helpers
	userData: ->
		username = Session.get('userProfileActive')

		userData = {
			# name: Session.get('user_' + username + '_name')
			# emails: Session.get('user_' + username + '_emails')
			username: username
		}
		# phone = Session.get('user_' + username + '_phone')
		# if phone? and phone[0]?.phoneNumber
		# 	userData.phone = phone[0]?.phoneNumber

		return userData

	canManageRoom: ->
		return false unless Router.current().params._id?

		roomData = Session.get('roomData' + Router.current().params._id)

		return false unless roomData?

		return roomData.u?._id is Meteor.userId() and not Session.equals('userProfileActive', Meteor.user().username)

Template.userCard.events
	'click .private-chat': (event) ->
		Meteor.call 'createDirectMessage', Session.get('userProfileActive'), (error, result) ->
			if error
				return Errors.throw error.reason

			if result.rid?
				Router.go('room', { _id: result.rid })

	'click .remove-user': (event) ->
		Meteor.call 'removeUserFromRoom', { rid: Router.current().params._id, username: Session.get('userProfileActive') }, (error, result) ->
			if error
				return Errors.throw error.reason
