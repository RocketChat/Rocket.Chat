import { Meteor } from 'meteor/meteor';
import { LivechatVisitors } from '@rocket.chat/models';

Meteor.methods({
	async 'livechat:loginByToken'(token) {
		const visitor = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });

		if (!visitor) {
			return;
		}

		return {
			_id: visitor._id,
		};
	},
});
