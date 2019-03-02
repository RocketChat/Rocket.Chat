import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Rooms } from 'meteor/rocketchat:models';
import { hasPermission } from 'meteor/rocketchat:authorization';
import { archiveRoom } from '../functions';

Meteor.methods({
	archiveRoom(rid) {

		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'archiveRoom' });
		}

		const room = Rooms.findOneById(rid);

		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'archiveRoom' });
		}

		if (!hasPermission(Meteor.userId(), 'archive-room', room._id)) {
			throw new Meteor.Error('error-not-authorized', 'Not authorized', { method: 'archiveRoom' });
		}

		if (room.t === 'd') {
			throw new Meteor.Error('error-direct-message-room', 'Direct Messages can not be archived', { method: 'archiveRoom' });
		}

		return archiveRoom(rid);
	},
});
