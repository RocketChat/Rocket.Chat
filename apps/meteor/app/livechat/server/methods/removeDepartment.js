import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	'livechat:removeDepartment'(_id) {
		methodDeprecationLogger.warn('livechat:removeDepartment will be deprecated in future versions of Rocket.Chat');

		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-departments')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:removeDepartment',
			});
		}

		return Livechat.removeDepartment(_id);
	},
});
