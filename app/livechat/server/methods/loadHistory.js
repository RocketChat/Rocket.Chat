import { Meteor } from 'meteor/meteor';

import { loadMessageHistory } from '../../../lib';
import { LivechatVisitors } from '../../../models';

Meteor.methods({
	'livechat:loadHistory'({ token, rid, end, limit = 20, ls }) {
		if (!token || typeof token !== 'string') {
			return;
		}

		const visitor = LivechatVisitors.getVisitorByToken(token, { fields: { _id: 1 } });

		if (!visitor) {
			return;
		}

		return loadMessageHistory({ userId: visitor._id, rid, end, limit, ls });
	},
});
