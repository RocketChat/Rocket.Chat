import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { LivechatVisitors } from '@rocket.chat/models';

import { LivechatRooms, Messages } from '../../../models/server';
import { Livechat } from '../lib/Livechat';
import { normalizeTransferredByData } from '../lib/Helper';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async 'livechat:setDepartmentForVisitor'({ roomId, visitorToken, departmentId } = {}) {
		methodDeprecationLogger.warn('livechat:setDepartmentForVisitor will be deprecated in future versions of Rocket.Chat');

		check(roomId, String);
		check(visitorToken, String);
		check(departmentId, String);

		const room = LivechatRooms.findOneById(roomId);
		const visitor = await LivechatVisitors.getVisitorByToken(visitorToken);

		if (!room || room.t !== 'l' || !room.v || room.v.token !== visitor.token) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room');
		}

		// update visited page history to not expire
		Messages.keepHistoryForToken(visitorToken);

		const transferData = {
			roomId,
			departmentId,
			transferredBy: normalizeTransferredByData(visitor, room),
		};

		return Livechat.transfer(room, visitor, transferData);
	},
});
