import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:saveDepartmentAgents'(_id, departmentAgents) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'add-livechat-department-agents')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveDepartmentAgents',
			});
		}

		return Livechat.saveDepartmentAgents(_id, { upsert: departmentAgents });
	},
});
