import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	async 'livechat:addAgent'(username) {
		methodDeprecationLogger.warn('livechat:addAgent will be deprecated in future versions of Rocket.Chat');
		if (!Meteor.userId() || !(await hasPermissionAsync(Meteor.userId(), 'manage-livechat-agents'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:addAgent' });
		}

		return Livechat.addAgent(username);
	},
});
