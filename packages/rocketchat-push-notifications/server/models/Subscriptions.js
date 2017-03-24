RocketChat.models.Subscriptions.updateAudioNotificationById = function(_id, audioNotification) {
	const query = {
		_id
	};

	const update = {
		$set: {
			audioNotification
		}
	};

	return this.update(query, update);
};

RocketChat.models.Subscriptions.updateDesktopNotificationsById = function(_id, desktopNotifications) {
	const query = {
		_id
	};

	const update = {
		$set: {
			desktopNotifications
		}
	};

	return this.update(query, update);
};

RocketChat.models.Subscriptions.updateDesktopNotificationDurationById = function(_id, value) {
	const query = {
		_id
	};

	const update = {
		$set: {
			desktopNotificationDuration: value - 0
		}
	};

	return this.update(query, update);
};

RocketChat.models.Subscriptions.updateMobilePushNotificationsById = function(_id, mobilePushNotifications) {
	const query = {
		_id
	};

	const update = {
		$set: {
			mobilePushNotifications
		}
	};

	return this.update(query, update);
};

RocketChat.models.Subscriptions.updateEmailNotificationsById = function(_id, emailNotifications) {
	const query = {
		_id
	};

	const update = {
		$set: {
			emailNotifications
		}
	};

	return this.update(query, update);
};

RocketChat.models.Subscriptions.updateUnreadAlertById = function(_id, unreadAlert) {
	const query = {
		_id
	};

	const update = {
		$set: {
			unreadAlert
		}
	};

	return this.update(query, update);
};

RocketChat.models.Subscriptions.findAlwaysNotifyDesktopUsersByRoomId = function(roomId) {
	const query = {
		rid: roomId,
		desktopNotifications: 'all'
	};

	return this.find(query);
};

RocketChat.models.Subscriptions.findDontNotifyDesktopUsersByRoomId = function(roomId) {
	const query = {
		rid: roomId,
		desktopNotifications: 'nothing'
	};

	return this.find(query);
};

RocketChat.models.Subscriptions.findAlwaysNotifyMobileUsersByRoomId = function(roomId) {
	const query = {
		rid: roomId,
		mobilePushNotifications: 'all'
	};

	return this.find(query);
};

RocketChat.models.Subscriptions.findDontNotifyMobileUsersByRoomId = function(roomId) {
	const query = {
		rid: roomId,
		mobilePushNotifications: 'nothing'
	};

	return this.find(query);
};

RocketChat.models.Subscriptions.findNotificationPreferencesByRoom = function(roomId) {
	const query = {
		rid: roomId,
		'u._id': {$exists: true},
		$or: [
			{audioNotification: {$exists: true}},
			{desktopNotifications: {$exists: true}},
			{desktopNotificationDuration: {$exists: true}},
			{mobilePushNotifications: {$exists: true}}
		]
	};

	return this.find(query);
};

RocketChat.models.Subscriptions.findWithSendEmailByRoomId = function(roomId) {
	const query = {
		rid: roomId,
		emailNotifications: {
			$exists: true
		}
	};

	return this.find(query, { fields: { emailNotifications: 1, u: 1 } });
};
