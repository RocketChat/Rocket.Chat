import { Meteor } from 'meteor/meteor';
import { Match, check } from 'meteor/check';

import { hasPermission } from '../../../authorization';
import { LivechatDepartmentAgents } from '../../../models';

Meteor.publish('livechat:departmentAgents', function(filter = {}) {
	if (!this.userId) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:departmentAgents' }));
	}

	if (!hasPermission(this.userId, 'view-l-room')) {
		return this.error(new Meteor.Error('error-not-authorized', 'Not authorized', { publish: 'livechat:departmentAgents' }));
	}

	check(filter, {
		agentId: Match.Maybe(String),
		departmentId: Match.Maybe(String),
	});

	return LivechatDepartmentAgents.find(filter);
});
