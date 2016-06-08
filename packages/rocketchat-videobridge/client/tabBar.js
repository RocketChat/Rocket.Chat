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
				let rid = Session.get('openedRoom');
				console.log('Checking if active', rid);
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
