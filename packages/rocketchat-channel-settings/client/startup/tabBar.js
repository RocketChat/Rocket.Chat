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

	RocketChat.TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'mail-messages',
		anonymous: true,
		i18nTitle: 'Mail_Messages',
		icon: 'mail',
		template: 'mailMessagesInstructions',
		order: 10
	});
});
