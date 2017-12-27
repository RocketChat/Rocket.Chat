Meteor.startup(function() {
	return RocketChat.TabBar.addButton({
		groups: ['channel', 'group'],
		id: 'livestream',
		i18nTitle: 'Livestream',
		icon: 'play',
		template: 'liveStreamTab',
		order: 3
	});
});
