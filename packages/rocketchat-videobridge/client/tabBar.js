Meteor.startup(function() {
	Tracker.autorun(function() {
			RocketChat.TabBar.addButton({
				groups: ['directmessage','privategroup'],
				id: 'video',
				i18nTitle: 'Video Chat',
				icon: 'icon-videocam',
				template: 'videoFlexTab',
				order: 12
			});
	});
});
