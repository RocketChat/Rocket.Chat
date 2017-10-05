Meteor.startup(function() {
	RocketChat.TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'push-notifications',
		i18nTitle: 'Notifications',
		icon: 'bell',
		template: 'pushNotificationsFlexTab',
		order: 2
	});
});
