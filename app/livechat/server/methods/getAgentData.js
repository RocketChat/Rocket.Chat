import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Users, LivechatRooms, LivechatVisitors } from '../../../models';

Meteor.methods({
	'livechat:getAgentData'({ roomId, token }) {
		check(roomId, String);
		check(token, String);

		const room = LivechatRooms.findOneById(roomId);
		const visitor = LivechatVisitors.getVisitorByToken(token);

		if (!room || room.t !== 'l' || !room.v || room.v.token !== visitor.token) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		if (!room.servedBy) {
			return;
		}

		return Users.getAgentInfo(room.servedBy._id);
	},
});
