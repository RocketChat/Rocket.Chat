import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	'livechat:saveDepartmentAgents'(_id, departmentAgents) {
		methodDeprecationLogger.warn('livechat:saveDepartmentAgents will be deprecated in future versions of Rocket.Chat');

		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'add-livechat-department-agents')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveDepartmentAgents',
			});
		}

		return Livechat.saveDepartmentAgents(_id, { upsert: departmentAgents });
	},
});
