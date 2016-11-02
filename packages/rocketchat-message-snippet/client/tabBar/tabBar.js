Meteor.startup(function() {
	Tracker.autorun(function() {
		if (RocketChat.settings.get('Message_AllowSnippeting')) {
			RocketChat.TabBar.addButton({
				groups: ['channel', 'privategroup', 'directmessages'],
				id: 'snippeted-messages',
				i18nTitle: 'Snippeted_Messages',
				icon: 'icon-code',
				template: 'snippetedMessages',
				order: 20
			});
		} else {
			RocketChat.TabBar.removeButton('snippeted-messages');
		}
	});
});
