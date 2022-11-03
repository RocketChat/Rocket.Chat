import { Meteor } from 'meteor/meteor';

import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	'livechat:pageVisited'(token, room, pageInfo) {
		methodDeprecationLogger.warn('livechat:pageVisited will be deprecated in future versions of Rocket.Chat');
		Livechat.savePageHistory(token, room, pageInfo);
	},
});
