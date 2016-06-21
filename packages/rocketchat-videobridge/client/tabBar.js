Meteor.startup(function() {
	Tracker.autorun(function() {
		if (RocketChat.settings.get('Jitsi_Enabled')) {

			// Load from the jitsi meet instance.
			if (typeof JitsiMeetExternalAPI !== undefined) {
				$.getScript('/packages/rocketchat_videobridge/client/public/external_api.js');
			}

			let tabGroups = ['directmessage', 'privategroup'];

			if (RocketChat.settings.get('Jitsi_Enable_Channels')) {
				tabGroups.push('channel');
			}

			RocketChat.TabBar.addButton({
				groups: tabGroups,
				id: 'video',
				i18nTitle: 'Video Chat',
				icon: 'icon-videocam',
				iconColor: 'red',
				template: 'videoFlexTab',
				width: 790,
				order: 12
			});

			// Compare current time to call started timeout.  If its past then call is probably over.
			if (Session.get('openedRoom')) {
				let rid = Session.get('openedRoom');

				let room = RocketChat.models.Rooms.findOne({_id: rid});
				let currentTime = new Date().getTime();
				let jitsiTimeout = new Date(room.jitsiTimeout).getTime() || currentTime;

				if (jitsiTimeout > currentTime) {
					RocketChat.TabBar.updateButton('video', { class: 'attention' });
				} else {
					RocketChat.TabBar.updateButton('video', { class: '' });
				}

			}
		}
	});
});
