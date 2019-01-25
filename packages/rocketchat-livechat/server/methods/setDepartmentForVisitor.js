import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { RocketChat } from 'meteor/rocketchat:lib';
import LivechatVisitors from '../models/LivechatVisitors';

Meteor.methods({
	'livechat:setDepartmentForVisitor'({ roomId, visitorToken, departmentId } = {}) {
		check(roomId, String);
		check(visitorToken, String);
		check(departmentId, String);

		const room = RocketChat.models.Rooms.findOneById(roomId);
		const visitor = LivechatVisitors.getVisitorByToken(visitorToken);

		if (!room || room.t !== 'l' || !room.v || room.v.token !== visitor.token) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		// update visited page history to not expire
		RocketChat.models.Messages.keepHistoryForToken(visitorToken);

		const transferData = {
			roomId,
			departmentId,
		};

		return RocketChat.Livechat.transfer(room, visitor, transferData);
	},
});
