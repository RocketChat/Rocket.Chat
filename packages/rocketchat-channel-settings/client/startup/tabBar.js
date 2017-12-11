Meteor.startup(() => {
	RocketChat.TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'channel-settings',
		anonymous: true,
		i18nTitle: 'Room_Info',
		icon: 'info-circled',
		template: 'channelSettings',
		order: 0
	});
});
