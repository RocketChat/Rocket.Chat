Meteor.startup(function() {
	RocketChat.TabBar.addButton({
		groups: ['channel', 'group', 'direct', 'groupchat'],
		id: 'starred-messages',
		i18nTitle: 'Starred_Messages',
		icon: 'star',
		template: 'starredMessages',
		order: 3
	});
});
