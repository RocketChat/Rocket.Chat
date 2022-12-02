import { LivechatInquiry, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { RoutingManager } from '../lib/RoutingManager';

Meteor.methods({
	async 'livechat:takeInquiry'(inquiryId, options) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:takeInquiry',
			});
		}

		const [inquiry, user] = await Promise.all([
			LivechatInquiry.findOneById(inquiryId),
			Users.findOneOnlineAgentById(Meteor.userId(), {
				project: { _id: 1, username: 1, roles: 1, status: 1, statusLivechat: 1 },
			}),
		]);

		if (!inquiry) {
			throw new Meteor.Error('error-not-found', 'Inquiry not found', {
				method: 'livechat:takeInquiry',
			});
		}

		if (inquiry.status === 'taken') {
			throw new Meteor.Error('error-inquiry-taken', 'Inquiry already taken', {
				method: 'livechat:takeInquiry',
			});
		}

		if (!user) {
			throw new Meteor.Error('error-agent-status-service-offline', 'Agent status is offline or Omnichannel service is not active', {
				method: 'livechat:takeInquiry',
			});
		}

		const agent = {
			agentId: user._id,
			username: user.username,
		};

		try {
			await RoutingManager.takeInquiry(inquiry, agent, options);
		} catch (e) {
			throw new Meteor.Error(e.message);
		}
	},
});
