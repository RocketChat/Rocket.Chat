import { Meteor } from 'meteor/meteor';
import { LivechatVisitors } from '@rocket.chat/models';

import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async 'livechat:loginByToken'(token) {
		methodDeprecationLogger.warn('livechat:loginByToken will be deprecated in future versions of Rocket.Chat');
		const visitor = await LivechatVisitors.getVisitorByToken(token, { projection: { _id: 1 } });

		if (!visitor) {
			return;
		}

		return {
			_id: visitor._id,
		};
	},
});
