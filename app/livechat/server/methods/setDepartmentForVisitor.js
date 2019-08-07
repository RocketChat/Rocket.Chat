import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Rooms, Messages, LivechatVisitors } from '../../../models';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:setDepartmentForVisitor'({ roomId, visitorToken, departmentId } = {}) {
		check(roomId, String);
		check(visitorToken, String);
		check(departmentId, String);

		const room = Rooms.findOneById(roomId);
		const visitor = LivechatVisitors.getVisitorByToken(visitorToken);

		if (!room || room.t !== 'l' || !room.v || room.v.token !== visitor.token) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		// update visited page history to not expire
		Messages.keepHistoryForToken(visitorToken);

		const transferData = {
			roomId,
			departmentId,
		};

		return Livechat.transfer(room, visitor, transferData);
	},
});
