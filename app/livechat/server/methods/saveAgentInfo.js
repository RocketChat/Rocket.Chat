import { Meteor } from 'meteor/meteor';

import { hasPermission, hasRole } from '../../../authorization/server';
import { Livechat } from '../lib/Livechat';
import { Users } from '../../../models/server';

Meteor.methods({
	'livechat:saveAgentInfo'(_id, agentData, agentDepartments) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-agents')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:saveAgentInfo',
			});
		}

		const user = Users.findOneById(_id);
		if (!user || !hasRole(_id, 'livechat-agent')) {
			throw new Meteor.Error('error-user-is-not-agent', 'User is not a livechat agent', {
				method: 'livechat:saveAgentInfo',
			});
		}

		return Livechat.saveAgentInfo(_id, agentData, agentDepartments);
	},
});
