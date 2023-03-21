import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async 'livechat:removeManager'(username) {
		methodDeprecationLogger.warn('livechat:removeManager will be deprecated in future versions of Rocket.Chat');

		if (!Meteor.userId() || !(await hasPermissionAsync(Meteor.userId(), 'manage-livechat-managers'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeManager',
			});
		}

		return Livechat.removeManager(username);
	},
});
