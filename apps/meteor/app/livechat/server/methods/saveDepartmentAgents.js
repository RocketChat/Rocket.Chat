import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { Livechat } from '../lib/Livechat';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	async 'livechat:saveDepartmentAgents'(_id, departmentAgents) {
		methodDeprecationLogger.warn('livechat:saveDepartmentAgents will be deprecated in future versions of Rocket.Chat');

		if (!Meteor.userId() || !(await hasPermissionAsync(Meteor.userId(), 'add-livechat-department-agents'))) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveDepartmentAgents',
			});
		}

		return Livechat.saveDepartmentAgents(_id, { upsert: departmentAgents });
	},
});
