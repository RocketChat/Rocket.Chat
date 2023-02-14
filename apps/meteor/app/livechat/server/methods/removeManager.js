import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	'livechat:removeManager'(username) {
		methodDeprecationLogger.warn('livechat:removeManager will be deprecated in future versions of Rocket.Chat');

		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-managers')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeManager',
			});
		}

		return Livechat.removeManager(username);
	},
});
