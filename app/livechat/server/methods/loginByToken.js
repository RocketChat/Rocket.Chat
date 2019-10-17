import { Meteor } from 'meteor/meteor';

import { LivechatVisitors } from '../../../models';

Meteor.methods({
	'livechat:loginByToken'(token) {
		const visitor = LivechatVisitors.getVisitorByToken(token, { fields: { _id: 1 } });

		if (!visitor) {
			return;
		}

		return {
			_id: visitor._id,
		};
	},
});
