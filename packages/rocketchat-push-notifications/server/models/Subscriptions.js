RocketChat.models.Subscriptions.updateDesktopNotificationsById = function(_id, desktopNotifications) {
	query = {
		_id: _id
	}

	update = {
		$set: {
			desktopNotifications: desktopNotifications
		}
	}

	return this.update(query, update);
}

RocketChat.models.Subscriptions.updateMobilePushNotificationsById = function(_id, mobilePushNotifications) {
	query = {
		_id: _id
	}

	update = {
		$set: {
			mobilePushNotifications: mobilePushNotifications
		}
	}

	return this.update(query, update);
}

RocketChat.models.Subscriptions.updateEmailNotificationsById = function(_id, emailNotifications) {
	query = {
		_id: _id
	}

	update = {
		$set: {
			emailNotifications: emailNotifications
		}
	}

	return this.update(query, update);
}

RocketChat.models.Subscriptions.findAlwaysNotifyDesktopUsersByRoomId = function(roomId) {
	query = {
		rid: roomId,
		desktopNotifications: 'all'
	}

	return this.find(query);
}

RocketChat.models.Subscriptions.findDontNotifyDesktopUsersByRoomId = function(roomId) {
	query = {
		rid: roomId,
		desktopNotifications: 'nothing'
	}

	return this.find(query);
}

RocketChat.models.Subscriptions.findAlwaysNotifyMobileUsersByRoomId = function(roomId) {
	query = {
		rid: roomId,
		mobilePushNotifications: 'all'
	}

	return this.find(query);
}

RocketChat.models.Subscriptions.findDontNotifyMobileUsersByRoomId = function(roomId) {
	query = {
		rid: roomId,
		mobilePushNotifications: 'nothing'
	}

	return this.find(query);
}
