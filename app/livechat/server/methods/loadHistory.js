import { Meteor } from 'meteor/meteor';
import { loadMessageHistory } from '/app/lib';
import { LivechatVisitors } from '/app/models';

Meteor.methods({
	'livechat:loadHistory'({ token, rid, end, limit = 20, ls }) {
		const visitor = LivechatVisitors.getVisitorByToken(token, { fields: { _id: 1 } });

		if (!visitor) {
			return;
		}

		return loadMessageHistory({ userId: visitor._id, rid, end, limit, ls });
	},
});
