import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { LivechatDepartmentAgents } from '../../../models';

Meteor.publish('livechat:departmentAgents', function(departmentId, agentId) {
	console.warn('The publication "livechat:departmentAgents" is deprecated and will be removed after version v3.0.0');
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:departmentAgents' }));
	}

	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:departmentAgents' }));
	}

	const filter = {
		...departmentId && { departmentId },
		...agentId && { agentId },
	};

	return LivechatDepartmentAgents.find(filter);
});
