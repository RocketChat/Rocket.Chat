Meteor.startup(function() {
	Tracker.autorun(function() {
		if (RocketChat.settings.get('Jitsi_Enabled')) {
			RocketChat.TabBar.addButton({
				groups: ['directmessage', 'privategroup'],
				id: 'video',
				i18nTitle: 'Video Chat',
				icon: 'icon-videocam',
				iconColor: 'red',
				template: 'videoFlexTab',
				width: 790,
				order: 12
			});

			if (Session.get('openedRoom')) {
				Meteor.call('jitsi:isActive', Session.get('openedRoom'), (err, value) => {
					if (value) {
						RocketChat.TabBar.updateButton('video', { class: 'attention' }); // or attention for blinking
					} else {
						RocketChat.TabBar.updateButton('video', { class: '' });
					}
				});
			}
		}
	});
});
