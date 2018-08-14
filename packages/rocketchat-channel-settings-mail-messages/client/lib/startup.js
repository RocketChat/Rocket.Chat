// import resetSelection from '../resetSelection';
Meteor.startup(() => {
	RocketChat.TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'mail-messages',
		anonymous: true,
		i18nTitle: 'Mail_Messages',
		icon: 'mail',
		template: 'mailMessagesInstructions',
		order: 10,
		condition: () => RocketChat.authz.hasAllPermission('mail-messages')
	});

	// RocketChat.callbacks.add('roomExit', () => resetSelection(false), RocketChat.callbacks.priority.MEDIUM, 'room-exit-mail-messages');
});
