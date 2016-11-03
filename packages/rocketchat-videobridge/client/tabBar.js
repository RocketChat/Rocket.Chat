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
		} else {
			RocketChat.TabBar.removeButton('video');
		}
	});

	Tracker.autorun(function() {
		if (RocketChat.settings.get('Jitsi_Enabled') && RocketChat.settings.get('Jitsi_Enable_Channels')) {
			RocketChat.TabBar.addGroup('video', ['channel']);
		} else {
			RocketChat.TabBar.removeGroup('video', ['channel']);
		}
	});

	Tracker.autorun(function() {
		if (RocketChat.settings.get('Jitsi_Enabled')) {
			// Load from the jitsi meet instance.
			if (typeof JitsiMeetExternalAPI === 'undefined') {
				$.getScript('/packages/rocketchat_videobridge/client/public/external_api.js');
			}

			// Compare current time to call started timeout.  If its past then call is probably over.
			if (Session.get('openedRoom')) {
				let rid = Session.get('openedRoom');

				let room = RocketChat.models.Rooms.findOne({_id: rid});
				let currentTime = new Date().getTime();
				let jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();

				if (jitsiTimeout > currentTime) {
					RocketChat.TabBar.updateButton('video', { class: 'attention' });
				} else {
					RocketChat.TabBar.updateButton('video', { class: '' });
				}
			}
		}
	});
});
