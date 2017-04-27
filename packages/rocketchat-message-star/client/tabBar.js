Meteor.startup(function() {
	return RocketChat.TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'starred-messages',
		i18nTitle: 'Starred_Messages',
		icon: 'icon-star',
		template: 'starredMessages',
		order: 3
	});
});
