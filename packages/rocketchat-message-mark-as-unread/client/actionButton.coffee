Meteor.startup ->
	RocketChat.MessageAction.addButton
		id: 'mark-message-as-unread'
		icon: 'icon-flag'
		i18nLabel: 'Mark_as_unread'
		context: [
			'message'
			'message-mobile'
		]
		action: (event, instance) ->
			message = @_arguments[1]
			RocketChat.MessageAction.hideDropDown()
			Meteor.call 'unreadMessages', message, (error, result) ->
				if error
					return handleError(error)
				subscription = ChatSubscription.findOne rid: message.rid
				if not subscription?
					return
				RoomManager.close subscription.t + subscription.name
				FlowRouter.go('home')
		validation: (message) ->
			return message.u._id isnt Meteor.user()._id
		order: 22
