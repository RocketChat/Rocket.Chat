import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermission } from '../../../authorization/server';
import { Users, LivechatInquiry } from '../../../models/server';
import { RoutingManager } from '../lib/RoutingManager';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:takeInquiry'(inquiryId: string, options?: { clientAction: boolean; forwardingToDepartment?: boolean }): unknown;
	}
}

Meteor.methods<ServerMethods>({
	async 'livechat:takeInquiry'(inquiryId, options) {
		const uid = Meteor.userId();
		if (!uid || !hasPermission(uid, 'view-l-room')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'livechat:takeInquiry',
			});
		}

		const inquiry = LivechatInquiry.findOneById(inquiryId);

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

		const user = Users.findOneOnlineAgentById(uid);
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
		} catch (e: any) {
			throw new Meteor.Error(e.message);
		}
	},
});
