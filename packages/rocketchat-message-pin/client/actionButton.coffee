Meteor.startup ->
	RocketChat.MessageAction.addButton
		id: 'pin-message'
		icon: 'icon-pin'
		i18nLabel: 'Pin_Message'
		action: (event, instance) ->
			message = @_arguments[1]
			Meteor.call 'pinMessage', message, (error, result) ->
				if error
					return Errors.throw error.reason
		validation: (message) ->
			if message.pinned
				return false

			if !RocketChat.settings.get('Message_AllowPinning')
				return false

			if RocketChat.settings.get('Message_AllowPinningByAnyone') or RocketChat.authz.hasRole Meteor.userId(), 'admin'
				return true

			return room.u?._id is Meteor.userId()
		order: 20

	RocketChat.MessageAction.addButton
		id: 'unpin-message'
		icon: 'icon-pin'
		i18nLabel: 'Unpin_Message'
		action: (event, instance) ->
			message = @_arguments[1]
			Meteor.call 'unpinMessage', message, (error, result) ->
				if error
					return Errors.throw error.reason
		validation: (message) ->
			if not message.pinned
				return false

			if !RocketChat.settings.get('Message_AllowPinning')
				return false

			if RocketChat.settings.get('Message_AllowPinningByAnyone') or RocketChat.authz.hasRole Meteor.userId(), 'admin'
				return true

			return room.u?._id is Meteor.userId()
		order: 20
