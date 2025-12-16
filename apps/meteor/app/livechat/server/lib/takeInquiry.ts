import { Omnichannel } from '@rocket.chat/core-services';
import { LivechatInquiry, LivechatRooms, Users } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { RoutingManager } from './RoutingManager';
import { isAgentAvailableToTakeContactInquiry } from './contacts/isAgentAvailableToTakeContactInquiry';
import { migrateVisitorIfMissingContact } from './contacts/migrateVisitorIfMissingContact';
import { settings } from '../../../settings/server';

export const takeInquiry = async (
	userId: string,
	inquiryId: string,
	options?: { clientAction: boolean; forwardingToDepartment?: { oldDepartmentId: string; transferData: any } },
): Promise<void> => {
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
			...(process.env.TEST_MODE && {
				Livechat_enabled_when_agent_idle: settings.get<boolean>('Livechat_enabled_when_agent_idle'),
				user: await Users.findOneById(userId),
			}),
		});
	}

	const room = await LivechatRooms.findOneById(inquiry.rid);
	if (!room || !(await Omnichannel.isWithinMACLimit(room))) {
		throw new Meteor.Error('error-mac-limit-reached');
	}

	const contactId = room.contactId ?? (await migrateVisitorIfMissingContact(room.v._id, room.source));
	if (contactId) {
		const isAgentAvailableToTakeContactInquiryResult = await isAgentAvailableToTakeContactInquiry(inquiry.v._id, room.source, contactId);
		if (!isAgentAvailableToTakeContactInquiryResult.value) {
			throw new Meteor.Error(isAgentAvailableToTakeContactInquiryResult.error);
		}
	}

	const agent = {
		agentId: user._id,
		username: user.username,
	};

	try {
		await RoutingManager.takeInquiry(inquiry, agent, options ?? {}, room);
	} catch (e: any) {
		throw new Meteor.Error(e.message);
	}
};
