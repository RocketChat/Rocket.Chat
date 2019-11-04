import { Meteor } from 'meteor/meteor';

import { hasPermission, hasRole } from '../../../authorization';
import { Users } from '../../../models/server';

Meteor.methods({
	'livechat:getAgentInfo'(username) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'manage-livechat-agents')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:getAgentInfo' });
		}

		const user = Users.findOneByUsername(username);
		if (!user || !hasRole(user._id, 'livechat-agent')) {
			throw new Meteor.Error('The_selected_user_is_not_an_agent', 'The selected user is not an agent', { method: 'livechat:getAgentInfo' });
		}

		return Users.getAgentInfo(user._id);
	},
});
