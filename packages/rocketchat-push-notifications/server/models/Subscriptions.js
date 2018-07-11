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

	if (desktopNotifications === null) {
		update.$unset = {
			desktopNotifications: 1,
			desktopPrefOrigin: 1
		};
	} else {
		update.$set = {
			desktopNotifications: desktopNotifications.value,
			desktopPrefOrigin: desktopNotifications.origin
		};
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

	if (mobilePushNotifications === null) {
		update.$unset = {
			mobilePushNotifications: 1,
			mobilePrefOrigin: 1
		};
	} else {
		update.$set = {
			mobilePushNotifications: mobilePushNotifications.value,
			mobilePrefOrigin: mobilePushNotifications.origin
		};
	}

	return this.update(query, update);
};

RocketChat.models.Subscriptions.updateEmailNotificationsById = function(_id, emailNotifications) {
	const query = {
		_id
	};

	const update = {};

	if (emailNotifications === null) {
		update.$unset = {
			emailNotifications: 1,
			emailPrefOrigin: 1
		};
	} else {
		update.$set = {
			emailNotifications: emailNotifications.value,
			emailPrefOrigin: emailNotifications.origin
		};
	}

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

RocketChat.models.Subscriptions.updateMuteGroupMentions = function(_id, muteGroupMentions) {
	const query = {
		_id
	};

	const update = {
		$set: {
			muteGroupMentions
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

RocketChat.models.Subscriptions.findWithSendEmailByRoomId = function(roomId) {
	const query = {
		rid: roomId,
		emailNotifications: {
			$exists: true
		}
	};

	return this.find(query, { fields: { emailNotifications: 1, u: 1 } });
};


RocketChat.models.Subscriptions.findNotificationPreferencesByRoom = function(query/*{ roomId: rid, desktopFilter: desktopNotifications, mobileFilter: mobilePushNotifications, emailFilter: emailNotifications }*/) {

	return this._db.find(query, {
		fields: {

			// fields needed for notifications
			rid: 1,
			t: 1,
			u: 1,
			name: 1,
			fname: 1,
			code: 1,

			// fields to define if should send a notification
			ignored: 1,
			audioNotifications: 1,
			audioNotificationValue: 1,
			desktopNotificationDuration: 1,
			desktopNotifications: 1,
			mobilePushNotifications: 1,
			emailNotifications: 1,
			disableNotifications: 1,
			muteGroupMentions: 1,
			userHighlights: 1
		}
	});
};

RocketChat.models.Subscriptions.findAllMessagesNotificationPreferencesByRoom = function(roomId) {
	const query = {
		rid: roomId,
		'u._id': {$exists: true},
		$or: [
			{ desktopNotifications: { $in: ['all', 'mentions'] } },
			{ mobilePushNotifications: { $in: ['all', 'mentions'] } },
			{ emailNotifications: { $in: ['all', 'mentions'] } }
		]
	};

	return this._db.find(query, {
		fields: {
			'u._id': 1,
			audioNotifications: 1,
			audioNotificationValue: 1,
			desktopNotificationDuration: 1,
			desktopNotifications: 1,
			mobilePushNotifications: 1,
			emailNotifications: 1,
			disableNotifications: 1,
			muteGroupMentions: 1
		}
	});
};
