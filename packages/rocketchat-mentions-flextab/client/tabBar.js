Meteor.startup(function() {
	return RocketChat.TabBar.addButton({
		groups: ['channel', 'group'],
		id: 'mentions',
		i18nTitle: 'Mentions',
		icon: 'icon-at',
		template: 'mentionsFlexTab',
		order: 3
	});
});
