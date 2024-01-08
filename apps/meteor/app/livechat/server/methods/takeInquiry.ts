import { Omnichannel } from '@rocket.chat/core-services';
import { LivechatInquiry, LivechatRooms, Users } from '@rocket.chat/models';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { settings } from '../../../settings/server';
import { RoutingManager } from '../lib/RoutingManager';

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		'livechat:takeInquiry'(
			inquiryId: string,
			options?: { clientAction: boolean; forwardingToDepartment?: { oldDepartmentId: string; transferData: any } },
		): unknown;
	}
}

export const takeInquiry = async (
	userId: string,
	inquiryId: string,
	options?: { clientAction: boolean; forwardingToDepartment?: { oldDepartmentId: string; transferData: any } },
): Promise<void> => {
	if (!userId || !(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Meteor.Error('error-not-allowed', 'Not allowed', {
			method: 'livechat:takeInquiry',
		});
	}

	const inquiry = await LivechatInquiry.findOneById(inquiryId);

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

	const user = await Users.findOneOnlineAgentById(userId, settings.get<boolean>('Livechat_enabled_when_agent_idle'));
	if (!user) {
		throw new Meteor.Error('error-agent-status-service-offline', 'Agent status is offline or Omnichannel service is not active', {
			method: 'livechat:takeInquiry',
		});
	}

	const room = await LivechatRooms.findOneById(inquiry.rid);
	if (!room || !(await Omnichannel.isWithinMACLimit(room))) {
		throw new Error('error-mac-limit-reached');
	}

	const agent = {
		agentId: user._id,
		username: user.username,
	};

	try {
		await RoutingManager.takeInquiry(inquiry, agent, room, options);
	} catch (e: any) {
		throw new Meteor.Error(e.message);
	}
};

Meteor.methods<ServerMethods>({
	async 'livechat:takeInquiry'(inquiryId, options) {
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-not-allowed', 'Invalid User', {
				method: 'livechat:takeInquiry',
			});
		}

		return takeInquiry(uid, inquiryId, options);
	},
});
