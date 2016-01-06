Meteor.startup ->
	RocketChat.TabBar.addButton({
		groups: ['channel', 'privategroup', 'directmessage'],
		id: 'starred-messages',
		i18nTitle: 'Starred_Messages',
		icon: 'icon-star',
		template: 'starredMessages',
		order: 3
	})
