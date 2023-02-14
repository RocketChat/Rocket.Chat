import { Meteor } from 'meteor/meteor';

import { Livechat } from '../lib/Livechat';
import { hasPermission } from '../../../authorization';
import Users from '../../../models/server/models/Users';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';

Meteor.methods({
	'livechat:changeLivechatStatus'({ status, agentId = Meteor.userId() } = {}) {
		methodDeprecationLogger.warn(
			'livechat:changeLivechatStatus is deprecated and will be removed in future versions of Rocket.Chat. Use /api/v1/livechat/agent.status REST API instead.',
		);

		const uid = Meteor.userId();

		if (!uid || !agentId) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:changeLivechatStatus',
			});
		}

		const agent = Users.findOneAgentById(agentId, {
			fields: {
				status: 1,
				statusLivechat: 1,
			},
		});

		if (!agent) {
			throw new Meteor.Error('error-not-allowed', 'Invalid Agent Id', {
				method: 'livechat:changeLivechatStatus',
			});
		}

		if (status && !['available', 'not-available'].includes(status)) {
			throw new Meteor.Error('error-not-allowed', 'Invalid Status', {
				method: 'livechat:changeLivechatStatus',
			});
		}

		const newStatus = status || (agent.statusLivechat === 'available' ? 'not-available' : 'available');

		if (newStatus === agent.statusLivechat) {
			return;
		}

		if (agentId !== uid) {
			if (!hasPermission(uid, 'manage-livechat-agents')) {
				throw new Meteor.Error('error-not-allowed', 'Not allowed', {
					method: 'livechat:saveAgentInfo',
				});
			}
			return Livechat.setUserStatusLivechat(agentId, newStatus);
		}

		if (!Livechat.allowAgentChangeServiceStatus(newStatus, agentId)) {
			throw new Meteor.Error('error-business-hours-are-closed', 'Not allowed', {
				method: 'livechat:changeLivechatStatus',
			});
		}

		return Livechat.setUserStatusLivechat(agentId, newStatus);
	},
});
