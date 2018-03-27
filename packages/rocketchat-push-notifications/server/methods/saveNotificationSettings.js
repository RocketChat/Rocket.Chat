Meteor.methods({
	saveNotificationSettings(roomId, field, value) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'saveNotificationSettings' });
		}
		check(roomId, String);
		check(field, String);
		check(value, String);

		const notifications = {
			'audioNotifications': {
				updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateAudioNotificationsById(subscription._id, value)
			},
			'desktopNotifications': {
				updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateDesktopNotificationsById(subscription._id, value)
			},
			'mobilePushNotifications': {
				updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateMobilePushNotificationsById(subscription._id, value)
			},
			'emailNotifications': {
				updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateEmailNotificationsById(subscription._id, value)
			},
			'unreadAlert': {
				updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateUnreadAlertById(subscription._id, value)
			},
			'disableNotifications': {
				updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateDisableNotificationsById(subscription._id, value === '1')
			},
			'hideUnreadStatus': {
				updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateHideUnreadStatusById(subscription._id, value === '1')
			},
			'desktopNotificationDuration': {
				updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateDesktopNotificationDurationById(subscription._id, value)
			},
			'audioNotificationValue': {
				updateMethod: (subscription, value) => RocketChat.models.Subscriptions.updateAudioNotificationValueById(subscription._id, value)
			}
		};
		const isInvalidNotification = !Object.keys(notifications).includes(field);
		const basicValuesForNotifications = ['all', 'mentions', 'nothing', 'default'];
		const fieldsMustHaveBasicValues = ['emailNotifications', 'audioNotifications', 'mobilePushNotifications', 'desktopNotifications'];

		if (isInvalidNotification) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings field', { method: 'saveNotificationSettings' });
		}

		if (fieldsMustHaveBasicValues.includes(field) && !basicValuesForNotifications.includes(value)) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings value', { method: 'saveNotificationSettings' });
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(roomId, Meteor.userId());
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', { method: 'saveNotificationSettings' });
		}

		notifications[field].updateMethod(subscription, value);

		return true;
	},

	saveAudioNotificationValue(rid, value) {
		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', { method: 'saveAudioNotificationValue' });
		}
		RocketChat.models.Subscriptions.updateAudioNotificationValueById(subscription._id, value);
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
