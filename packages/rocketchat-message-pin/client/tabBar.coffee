Meteor.startup ->
	Tracker.autorun ->
		if RocketChat.settings.get 'Message_AllowPinning'
			RocketChat.TabBar.addButton({
				groups: ['channel', 'privategroup', 'directmessage'],
				id: 'pinned-messages',
				i18nTitle: 'Pinned_Messages',
				icon: 'icon-pin',
				template: 'pinnedMessages',
				order: 10
			})
		else
			RocketChat.TabBar.removeButton 'pinned-messages'
