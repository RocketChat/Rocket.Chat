Meteor.startup ->
	RocketChat.MessageAction.addButton
		id: 'pin-message'
		icon: 'icon-pin'
		i18nLabel: 'Pin_Message'
		context: [
			'pinned'
			'message'
			'message-mobile'
		]
		action: (event, instance) ->
			message = @_arguments[1]
			message.pinned = true
			Meteor.call 'pinMessage', message, (error, result) ->
				if error
					return toastr.error error.reason
		validation: (message) ->
			if message.pinned or not RocketChat.settings.get('Message_AllowPinning')
				return false

			return RocketChat.authz.hasAtLeastOnePermission 'pin-message', message.rid

		order: 20

	RocketChat.MessageAction.addButton
		id: 'unpin-message'
		icon: 'icon-pin rotate-45'
		i18nLabel: 'Unpin_Message'
		context: [
			'pinned'
			'message'
			'message-mobile'
		]
		action: (event, instance) ->
			message = @_arguments[1]
			message.pinned = false
			Meteor.call 'unpinMessage', message, (error, result) ->
				if error
					return toastr.error error.reason
		validation: (message) ->
			if not message.pinned or not RocketChat.settings.get('Message_AllowPinning')
				return false

			return RocketChat.authz.hasAtLeastOnePermission 'pin-message', message.rid

		order: 21

	RocketChat.MessageAction.addButton
		id: 'jump-to-pin-message'
		icon: 'icon-right-hand'
		i18nLabel: 'Jump_to_message'
		context: [
			'pinned'
		]
		action: (event, instance) ->
			message = @_arguments[1]
			$('.message-dropdown:visible').hide()
			RoomHistoryManager.getSurroundingMessages(message, 50)
		order: 100

