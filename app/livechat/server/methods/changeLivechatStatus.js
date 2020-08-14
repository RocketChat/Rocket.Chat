import { Meteor } from 'meteor/meteor';

import { Livechat } from '../lib/Livechat';
import { hasPermission, hasRole } from '../../../authorization';
import { Users } from '../../../models';

Meteor.methods({
	'livechat:changeLivechatStatus'(agentId) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:changeLivechatStatus' });
		}

		let user = Meteor.user();

		if (agentId && hasPermission(Meteor.userId(), 'manage-livechat-agents')) {
			user = Users.findOneById(agentId);
			if (!user || !hasRole(agentId, 'livechat-agent')) {
				throw new Meteor.Error('error-user-is-not-agent', 'User is not a livechat agent', { method: 'livechat:saveAgentInfo' });
			}
		}

		const newStatus = user.statusLivechat === 'available' ? 'not-available' : 'available';
		if (!Livechat.allowAgentChangeServiceStatus(newStatus, user._id)) {
			throw new Meteor.Error('error-business-hours-are-closed', 'Not allowed', { method: 'livechat:changeLivechatStatus' });
		}

		return Livechat.setUserStatusLivechat(user._id, newStatus);
	},
});
