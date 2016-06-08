Meteor.startup(function() {
	Tracker.autorun(function() {
		if (RocketChat.settings.get('Jitsi_Enabled')) {

			// Load from the jitsi meet instance.
			if (typeof JitsiMeetExternalAPI !== undefined) {
				let domain = RocketChat.settings.get('Jitsi_Domain');
				let ssl = RocketChat.settings.get('Jitsi_SSL');

				// Swap below url tomorrow after PR goes live on meet.jit.si
				// '//' + domain + 'external_api.js'
				$.getScript('https://cdn.rawgit.com/geekgonecrazy/jitsi-meet/master/external_api.js');
			}

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
