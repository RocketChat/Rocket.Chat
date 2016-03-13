Meteor.startup ->
	RocketChat.ChannelSettings.addOption
		id: 'mail-messages'
		template: 'channelSettingsMailMessages'
		validation: ->
			return RocketChat.authz.hasAllPermission('mail-messages')

	RocketChat.callbacks.add 'roomExit', (mainNode) ->
		messagesBox = $('.messages-box')
		if messagesBox.get(0)?
			instance = Blaze.getView(messagesBox.get(0))?.templateInstance()
			instance?.resetSelection(false)
	, RocketChat.callbacks.priority.MEDIUM, 'room-exit-mail-messages'
