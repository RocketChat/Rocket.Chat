Meteor.methods({
	saveNotificationSettings: function(rid, field, value) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'saveNotificationSettings' });
		}

		check(rid, String);
		check(field, String);
		check(value, String);

		if (['desktopNotifications', 'mobilePushNotifications', 'emailNotifications'].indexOf(field) === -1) {
			throw new Meteor.Error('invalid-settings', 'Invalid settings field');
		}

		if (['all', 'mentions', 'nothing', 'default'].indexOf(value) === -1) {
			throw new Meteor.Error('invalid-settings', 'Invalid settings value');
		}

		const subscription = RocketChat.models.Subscriptions.findOneByRoomIdAndUserId(rid, Meteor.userId());
		if (!subscription) {
			throw new Meteor.Error('invalid-subscription', 'Invalid subscription');
		}

		if (field === 'desktopNotifications') {
			RocketChat.models.Subscriptions.updateDesktopNotificationsById(subscription._id, value);
		} else if (field === 'mobilePushNotifications') {
			RocketChat.models.Subscriptions.updateMobilePushNotificationsById(subscription._id, value);
		} else if (field === 'emailNotifications') {
			RocketChat.models.Subscriptions.updateEmailNotificationsById(subscription._id, value);
		}

		return true;
	}
});
