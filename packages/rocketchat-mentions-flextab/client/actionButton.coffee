Meteor.startup ->
	RocketChat.MessageAction.addButton
		id: 'jump-to-message'
		icon: 'icon-right-hand'
		i18nLabel: 'Jump_to_message'
		context: [
			'mentions'
		]
		action: (event, instance) ->
			message = @_arguments[1]
			RocketChat.MessageAction.hideDropDown()
			RoomHistoryManager.getSurroundingMessages(message, 50)

		validation: (message) ->
			return message.mentionedList is true

		order: 100
