Meteor.startup(function() {
	Tracker.autorun(function() {
		if (RocketChat.settings.get('Livechat_continuous_sound_notification_new_livechat_message')) {
			const unreadAlertCount = ChatSubscription.find({ t: 'l', open: true, alert: true, disableNotifications: { $ne: true }, audioNotifications: { $ne: 'nothing'} }, { fields: { unread: 1, alert: 1, rid: 1, unreadAlert: 1 } }).count();
			const user = RocketChat.models.Users.findOne(Meteor.userId(), {
				fields: {
					'settings.preferences.newRoomNotification': 1
				}
			});

			const newRoomNotification = RocketChat.getUserPreference(user, 'newRoomNotification');
			const [audio] = $(`audio#${ newRoomNotification }`);
			if (audio && audio.play) {
				if (unreadAlertCount > 0) {
					Meteor.setTimeout(() => {
						if (audio && audio.play) {
							audio.loop = true;
							return audio.play();
						}
					}, 1000);
				} else {
					if (audio.pause) {
						audio.pause();
					}
					audio.loop = false;
				}
			}
		}
	});
});
