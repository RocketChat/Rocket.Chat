Meteor.startup ->
	RocketChat.MessageAction.addButon
		id: 'pin-message'
		icon: 'icon-pin'
		i18nLabel: 'rocketchat-message-pin:Pin_message'
		action: (event, instance) ->
			console.log arguments
		validation: (message) ->
			return RocketChat.authz.hasAtLeastOnePermission('pin-message', message.rid) and RocketChat.settings.get('Message_AllowPinning')
		order: 1