
RocketChat.saveRoomType = function(rid, roomType, user, sendMessage = true) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			'function': 'RocketChat.saveRoomType'
		});
	}
	if (roomType !== 'c' && roomType !== 'p') {
		throw new Meteor.Error('error-invalid-room-type', 'error-invalid-room-type', {
			'function': 'RocketChat.saveRoomType',
			type: roomType
		});
	}
	const room = RocketChat.models.Rooms.findOneById(rid);
	if (room == null) {
		throw new Meteor.Error('error-invalid-room', 'error-invalid-room', {
			'function': 'RocketChat.saveRoomType',
			_id: rid
		});
	}
	if (room.t === 'd') {
		throw new Meteor.Error('error-direct-room', 'Can\'t change type of direct rooms', {
			'function': 'RocketChat.saveRoomType'
		});
	}
	const result = RocketChat.models.Rooms.setTypeById(rid, roomType) && RocketChat.models.Subscriptions.updateTypeByRoomId(rid, roomType);
	if (result && sendMessage) {
		let message;
		if (roomType === 'c') {
			message = TAPi18n.__('Channel', {
				lng: user && user.language || RocketChat.settings.get('language') || 'en'
			});
		} else {
			message = TAPi18n.__('Private_Group', {
				lng: user && user.language || RocketChat.settings.get('language') || 'en'
			});
		}
		RocketChat.models.Messages.createRoomSettingsChangedWithTypeRoomIdMessageAndUser('room_changed_privacy', rid, message, user);
	}
	return result;
};
