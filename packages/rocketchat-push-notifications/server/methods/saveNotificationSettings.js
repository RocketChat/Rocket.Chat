Meteor.methods({
	saveNotificationSettings(rid, field, value) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'saveNotificationSettings' });
		}

		check(rid, String);
		check(field, String);

		if (field === 'doNotDisturb') {
			if (value && value.initialTime && value.finalTime) {
				check(value, {
					initialTime: String,
					finalTime: String,
					repeatFor: String,
					limitDateTime: Match.Maybe(Date)
				});

				const timeFormat = new RegExp('([01]?[0-9]|2[0-3]):[0-5][0-9]');

				if (!timeFormat.test(value.initialTime) || !timeFormat.test(value.finalTime)) {
					throw new Meteor.Error('error-invalid-time-format', 'Invalid time format', { method: 'saveNotificationSettings' });
				}
			} else {
				value = {};
			}
		} else if (field === 'snoozeNotifications') {
			if (value && value.initialDateTime && value.finalDateTime) {
				check(value, {
					duration: Match.Maybe(Number),
					initialDateTime: Date,
					finalDateTime: Date
				});
			} else {
				value = {};
			}
		} else {
			check(value, String);
		}

		if (['audioNotifications', 'desktopNotifications', 'mobilePushNotifications', 'emailNotifications', 'unreadAlert', 'disableNotifications', 'hideUnreadStatus', 'snoozeNotifications', 'doNotDisturb'].indexOf(field) === -1) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings field', { method: 'saveNotificationSettings' });
		}

		if (field !== 'hideUnreadStatus' && field !== 'disableNotifications' && field !== 'snoozeNotifications' && field !== 'doNotDisturb' && ['all', 'mentions', 'nothing', 'default'].indexOf(value) === -1) {
			throw new Meteor.Error('error-invalid-settings', 'Invalid settings value', { method: 'saveNotificationSettings' });
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (!subscription) {
			throw new Meteor.Error('error-invalid-subscription', 'Invalid subscription', { method: 'saveNotificationSettings' });
		}

		switch (field) {
			case 'audioNotifications':
				RocketChat.models.Subscriptions.updateAudioNotificationsById(subscription._id, value);
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
			case 'disableNotifications':
				RocketChat.models.Subscriptions.updateDisableNotificationsById(subscription._id, value === '1' ? true : false);
				break;
			case 'hideUnreadStatus':
				RocketChat.models.Subscriptions.updateHideUnreadStatusById(subscription._id, value === '1' ? true : false);
				break;
			case 'doNotDisturb':
				RocketChat.models.Subscriptions.updateDoNotDisturbById(subscription._id, value);
				break;
			case 'snoozeNotifications':
				RocketChat.models.Subscriptions.updateSnoozeNotificationsById(subscription._id, value);
				break;
		}

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
