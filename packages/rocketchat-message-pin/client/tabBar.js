Meteor.startup(function() {
	return Tracker.autorun(function() {
		if (RocketChat.settings.get('Message_AllowPinning')) {
			return RocketChat.TabBar.addButton({
				groups: ['channel', 'group', 'direct'],
				id: 'pinned-messages',
				i18nTitle: 'Pinned_Messages',
				icon: 'icon-pin',
				template: 'pinnedMessages',
				order: 10
			});
		} else {
			return RocketChat.TabBar.removeButton('pinned-messages');
		}
	});
});
