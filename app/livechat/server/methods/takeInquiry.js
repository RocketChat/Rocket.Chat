import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Users, LivechatInquiry } from '../../../models/server';
import { RoutingManager } from '../lib/RoutingManager';

Meteor.methods({
	'livechat:takeInquiry'(inquiryId) {
		if (!Meteor.userId() || !hasPermission(Meteor.userId(), 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'livechat:takeInquiry' });
		}

		const inquiry = LivechatInquiry.findOneById(inquiryId);

		if (!inquiry || inquiry.status === 'taken') {
			throw new Meteor.Error('error-not-allowed', 'Inquiry already taken', { method: 'livechat:takeInquiry' });
		}

		const user = Users.findOneById(Meteor.userId());
		const { status, statusLivechat } = user;
		if (status === 'offline' || statusLivechat !== 'available') {
			throw new Meteor.Error('error-agent-offline', 'Agent offline', { method: 'livechat:takeInquiry' });
		}

		const agent = {
			agentId: user._id,
			username: user.username,
		};

		return RoutingManager.takeInquiry(inquiry, agent);
	},
});
