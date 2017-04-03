Meteor.methods({
	saveNotificationSettings(rid, field, value) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'saveNotificationSettings' });
		}

		check(rid, String);
		check(field, String);
		check(value, String);

		if (['audioNotification', 'desktopNotifications', 'mobilePushNotifications', 'emailNotifications', 'unreadAlert'].indexOf(field) === -1) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings field', { method: 'saveNotificationSettings' });
		}

		if (field !== 'audioNotification' && ['all', 'mentions', 'nothing', 'default'].indexOf(value) === -1) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings value', { method: 'saveNotificationSettings' });
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', { method: 'saveNotificationSettings' });
		}

		switch (field) {
			case 'audioNotification':
				RocketChat.models.Subscriptions.updateAudioNotificationById(subscription._id, value);
				break;
			case 'desktopNotifications':
				RocketChat.models.Subscriptions.updateDesktopNotificationsById(subscription._id, value);
				break;
			case 'mobilePushNotifications':
				RocketChat.models.Subscriptions.updateMobilePushNotificationsById(subscription._id, value);
				break;
			case 'emailNotifications':
				RocketChat.models.Subscriptions.updateEmailNotificationsById(subscription._id, value);
				break;
			case 'unreadAlert':
				RocketChat.models.Subscriptions.updateUnreadAlertById(subscription._id, value);
				break;
		}

		return true;
	},

	saveDesktopNotificationDuration(rid, value) {
		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', { method: 'saveDesktopNotificationDuration' });
		}
		RocketChat.models.Subscriptions.updateDesktopNotificationDurationById(subscription._id, value);
		return true;
	}
});
