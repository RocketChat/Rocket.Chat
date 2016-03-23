Meteor.startup ->
	RocketChat.TabBar.addButton
		groups: ['channel', 'privategroup', 'directmessage']
		id: 'channel-settings'
		i18nTitle: 'Room_Info'
		icon: 'icon-info-circled'
		template: 'channelSettings'
		order: 0
