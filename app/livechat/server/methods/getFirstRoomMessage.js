import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Rooms, Messages } from '../../../models';

Meteor.methods({
	'livechat:getFirstRoomMessage'({ rid }) {
		check(rid, String);

		const room = Rooms.findOneById(rid);

		if (!room || room.t !== 'l') {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		return Messages.findOne({ rid }, { sort: { ts: 1 } });
	},
});
