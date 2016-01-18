Meteor.startup ->
	RocketChat.TabBar.addButton({
		groups: ['channel', 'privategroup'],
		id: 'mentions',
		i18nTitle: 'Mentions',
		icon: 'icon-at',
		template: 'mentionsFlexTab',
		order: 3
	})
