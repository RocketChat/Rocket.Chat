import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:addAgent'(username) {
		methodDeprecationLogger.warn('livechat:addAgent will be deprecated in future versions of Rocket.Chat');
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-agents')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addAgent' });
		}

		return Livechat.addAgent(username);
	},
});
