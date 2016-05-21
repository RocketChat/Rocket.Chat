Meteor.startup(function() {
	Tracker.autorun(function() {
		RocketChat.TabBar.addButton({
			groups: ['directmessage', 'privategroup', 'channel'],
			id: 'jitsi',
			i18nTitle: 'OTR',
			icon: 'icon-videocam',
			template: 'jitsiPanel',
			order: 4
		});
	});
});
