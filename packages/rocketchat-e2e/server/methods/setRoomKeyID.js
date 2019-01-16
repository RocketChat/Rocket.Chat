import { Meteor } from 'meteor/meteor';
import { Rooms } from 'meteor/rocketchat:models';

Meteor.methods({
	'e2e.setRoomKeyID'(rid, keyID) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'e2e.setRoomKeyID' });
		}

		const room = Meteor.call('canAccessRoom', rid, userId);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'e2e.setRoomKeyID' });
		}

		if (room.e2eKeyId) {
			throw new Meteor.Error('error-room-e2e-key-already-exists', 'E2E Key ID already exists', { method: 'e2e.setRoomKeyID' });
		}

		return Rooms.setE2eKeyId(room._id, keyID);
	},
});
