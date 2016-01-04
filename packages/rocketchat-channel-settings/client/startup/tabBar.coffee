Meteor.startup ->

	RocketChat.callbacks.add 'enter-room', (subscription) ->

		RocketChat.TabBar.addButton
			id: 'channel-settings'
			i18nTitle: 'Room_Info'
			icon: 'octicon octicon-info'
			template: 'channelSettings'
			order: 0

	, RocketChat.callbacks.priority.MEDIUM, 'enter-room-tabbar-channel-settings'
