Meteor.startup ->

	RocketChat.callbacks.add 'enter-room', (subscription) ->

		if RocketChat.authz.hasAtLeastOnePermission('edit-room', subscription?.rid)
			RocketChat.TabBar.addButton
				id: 'channel-settings'
				i18nTitle: 'Channel_Settings'
				icon: 'octicon octicon-gear'
				template: 'channelSettings'
				order: 0
	, RocketChat.callbacks.priority.MEDIUM, 'enter-room-tabbar-channel-settings'
