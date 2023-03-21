import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async 'livechat:removeAgent'(username) {
		methodDeprecationLogger.warn('livechat:removeAgent will be deprecated in future versions of Rocket.Chat');
		if (!Meteor.userId() || !(await hasPermissionAsync(Meteor.userId(), 'manage-livechat-agents'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeAgent',
			});
		}

		return Livechat.removeAgent(username);
	},
});
