RocketChat.models.Subscriptions.updateAudioNotificationsById = function(_id, audioNotifications) {
	const query = {
		_id
	};

	const update = {};

	if (audioNotifications === 'default') {
		update.$unset = { audioNotifications: 1 };
	} else {
		update.$set = { audioNotifications };
	}

	return this.update(query, update);
};

RocketChat.models.Subscriptions.updateAudioNotificationValueById = function(_id, audioNotificationValue) {
	const query = {
		_id
	};

	const update = {
		$set: {
			audioNotificationValue
		}
	};

	return this.update(query, update);
};

RocketChat.models.Subscriptions.updateDesktopNotificationsById = function(_id, desktopNotifications) {
	const query = {
		_id
	};

	const update = {};

	if (desktopNotifications === 'default') {
		update.$unset = { desktopNotifications: 1 };
	} else {
		update.$set = { desktopNotifications };
	}

	return this.update(query, update);
};

RocketChat.models.Subscriptions.updateDesktopNotificationDurationById = function(_id, value) {
	const query = {
		_id
	};

	const update = {
		$set: {
			desktopNotificationDuration: parseInt(value)
		}
	};

	return this.update(query, update);
};

RocketChat.models.Subscriptions.updateMobilePushNotificationsById = function(_id, mobilePushNotifications) {
	const query = {
		_id
	};

	const update = {};

	if (mobilePushNotifications === 'default') {
		update.$unset = { mobilePushNotifications: 1 };
	} else {
		update.$set = { mobilePushNotifications };
	}

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

RocketChat.models.Subscriptions.updateDisableNotificationsById = function(_id, disableNotifications) {
	const query = {
		_id
	};

	const update = {
		$set: {
			disableNotifications
		}
	};

	return this.update(query, update);
};

RocketChat.models.Subscriptions.updateHideUnreadStatusById = function(_id, hideUnreadStatus) {
	const query = {
		_id
	};

	const update = {
		$set: {
			hideUnreadStatus
		}
	};

	return this.update(query, update);
};

RocketChat.models.Subscriptions.findAlwaysNotifyAudioUsersByRoomId = function(roomId) {
	const query = {
		rid: roomId,
		audioNotifications: 'all'
	};

	return this.find(query);
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

RocketChat.models.Subscriptions.findNotificationPreferencesByRoom = function(roomId, explicit) {
	const query = {
		rid: roomId,
		'u._id': {$exists: true}
	};

	if (explicit) {
		query.$or = [
			{audioNotifications: {$exists: true}},
			{audioNotificationValue: {$exists: true}},
			{desktopNotifications: {$exists: true}},
			{desktopNotificationDuration: {$exists: true}},
			{mobilePushNotifications: {$exists: true}},
			{disableNotifications: {$exists: true}}
		];
	}

	return this.find(query, { fields: { 'u._id': 1, audioNotifications: 1, audioNotificationValue: 1, desktopNotificationDuration: 1, desktopNotifications: 1, mobilePushNotifications: 1, disableNotifications: 1 } });
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
