import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Livechat } from '../lib/Livechat';

Meteor.methods({
	'livechat:saveDepartment'(_id, departmentData, departmentAgents) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-departments')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveDepartment',
			});
		}

		return Livechat.saveDepartment(_id, departmentData, { upsert: departmentAgents });
	},
});
