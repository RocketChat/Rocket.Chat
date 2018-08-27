/* globals RocketChat*/
RocketChat.saveRoomSecrecy= function(rid, value = false) {
	if (!Match.test(rid, String)) {
		throw new Meteor.Error('invalid-room', 'Invalid room', {
			'function': 'RocketChat.saveRoomSecrecy'
		});
	}
	const room = RocketChat.models.Rooms.findOneById(rid);
	if (room == null) {
		throw new Meteor.Error('error-invalid-room', 'error-invalid-room', {
			'function': 'RocketChat.saveRoomSecrecy',
			_id: rid
		});
	}
	if (room.t !== 'p' && value === true) {
		throw new Meteor.Error('invalid-secret-value', 'Invalid secrecy value', { 'function': 'RocketChat.saveRoomSecrecy' });
	}
	return RocketChat.models.Rooms.setSecretById(rid, value);
};
