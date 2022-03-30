import { Meteor } from 'meteor/meteor';

import { loadMessageHistory } from '../../../lib';
import { LivechatVisitors, LivechatRooms } from '../../../models';

Meteor.methods({
	'livechat:loadHistory'({ token, rid, end, limit = 20, ls }) {
		if (!token || typeof token !== 'string') {
			return;
		}

		const visitor = LivechatVisitors.getVisitorByToken(token, { fields: { _id: 1 } });

		if (!visitor) {
			throw new Meteor.Error('invalid-visitor', 'Invalid Visitor', {
				method: 'livechat:loadHistory',
			});
		}

		const room = LivechatRooms.findOneByIdAndVisitorToken(rid, token, { _id: 1 });
		if (!room) {
			throw new Meteor.Error('invalid-room', 'Invalid Room', { method: 'livechat:loadHistory' });
		}

		return loadMessageHistory({ userId: visitor._id, rid, end, limit, ls });
	},
});
