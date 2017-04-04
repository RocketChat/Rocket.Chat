
RocketChat.saveRoomName = function(rid, name, user, sendMessage = true) {
	const room = RocketChat.models.Rooms.findOneById(rid);
	if (room.t !== 'c' && room.t !== 'p') {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			'function': 'RocketChat.saveRoomName'
		});
	}
	let nameValidation;
	try {
		nameValidation = new RegExp(`^${ RocketChat.settings.get('UTF8_Names_Validation') }$`);
	} catch (error) {
		nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
	}
	if (!nameValidation.test(name)) {
		throw new Meteor.Error('error-invalid-room-name', `${ name } is not a valid room name. Use only letters, numbers, hyphens and underscores`, {
			'function': 'RocketChat.saveRoomName',
			room_name: name
		});
	}
	if (name === room.name) {
		return;
	}
	if (RocketChat.models.Rooms.findOneByName(name)) {
		throw new Meteor.Error('error-duplicate-channel-name', `A channel with name '${ name }' exists`, {
			'function': 'RocketChat.saveRoomName',
			channel_name: name
		});
	}
	const update = RocketChat.models.Rooms.setNameById(rid, name) && RocketChat.models.Subscriptions.updateNameAndAlertByRoomId(rid, name);
	if (update && sendMessage) {
		RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser(rid, name, user);
	}
	return name;
};
