import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization';
import { Users } from '../../../models';
import { LivechatInquiry } from '../../lib/LivechatInquiry';
import { Livechat } from '../lib/Livechat';
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

		const agent = {
			agentId: user._id,
			username: user.username,
		};

		return RoutingManager.takeInquiry(inquiry, agent);
	},
});
