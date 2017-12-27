Meteor.startup(function() {
	Tracker.autorun(function() {
		if (RocketChat.settings.get('Livestream_enabled')) {
			return RocketChat.TabBar.addButton({
				groups: ['channel', 'group'],
				id: 'livestream',
				i18nTitle: 'Livestream',
				icon: 'play',
				template: 'liveStreamTab',
				order: 3
			});
		} else {
			RocketChat.TabBar.removeButton('livestream');
		}
	});
});
