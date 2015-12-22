Meteor.startup ->
	RocketChat.ChannelSettings.addOption
		id: 'mail-messages'
		template: 'channelSettingsMailMessages'
		validation: ->
			return RocketChat.authz.hasAllPermission('mail-messages')

	RocketChat.callbacks.add 'roomExit', (mainNode) ->
		instance = Blaze.getView($('.messages-box')?[0])?.templateInstance()
		instance?.resetSelection(false)
	, RocketChat.callbacks.priority.MEDIUM, 'room-exit-mail-messages'
