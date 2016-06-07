Meteor.startup(function() {
	Tracker.autorun(function() {
		if (RocketChat.settings.get('Jitsi_Enabled')) {
			RocketChat.TabBar.addButton({
				groups: ['directmessage', 'privategroup'],
				id: 'video',
				i18nTitle: 'Video Chat',
				icon: 'icon-videocam',
				template: 'videoFlexTab',
				width: 790,
				order: 12
			});
		}
	});
});
