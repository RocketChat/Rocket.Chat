Meteor.startup ->
	RocketChat.callbacks.add 'enter-room', ->
		if RocketChat.settings.get 'Message_AllowPinning'
			RocketChat.TabBar.addButton({ id: 'pinned-messages', i18nTitle: 'Pinned_Messages', icon: 'icon-pin', template: 'pinnedMessages', order: 10 })
	, RocketChat.callbacks.priority.MEDIUM, 'enter-room-tabbar-pin'
