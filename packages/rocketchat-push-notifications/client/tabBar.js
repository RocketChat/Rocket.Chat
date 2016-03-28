Meteor.startup(function() {
	RocketChat.TabBar.addButton({
		groups: ['channel', 'privategroup', 'directmessage'],
		id: 'push-notifications',
		i18nTitle: 'Push_notifications',
		icon: 'icon-bell-alt',
		template: 'pushNotificationsFlexTab',
		order: 2
	});
});
