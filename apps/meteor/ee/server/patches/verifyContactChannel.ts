import type { ILivechatContact, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatInquiry, LivechatRooms } from '@rocket.chat/models';

import { saveQueueInquiry } from '../../../app/livechat/server/lib/QueueManager';
import { mergeContacts } from '../../../app/livechat/server/lib/contacts/mergeContacts';
import { verifyContactChannel } from '../../../app/livechat/server/lib/contacts/verifyContactChannel';
import { contactLogger as logger } from '../../app/livechat-enterprise/server/lib/logger';

export const runVerifyContactChannel = async (
	_next: any,
	params: {
		contactId: string;
		field: string;
		value: string;
		visitorId: string;
		roomId: string;
	},
): Promise<ILivechatContact | null> => {
	const { contactId, field, value, visitorId, roomId } = params;

	const room = await LivechatRooms.findOneById<Pick<IOmnichannelRoom, '_id' | 'source'>>(roomId, { projection: { source: 1 } });
	if (!room) {
		throw new Error('error-invalid-room');
	}

	logger.debug(`Start verifying contact channel for visitor ${visitorId} and room ${roomId}`);

	await LivechatContacts.updateContactChannel(
		{
			visitorId,
			source: room.source,
		},
		{
			verified: true,
			verifiedAt: new Date(),
			field,
			value: value.toLowerCase(),
		},
	);

	await LivechatRooms.update({ _id: roomId }, { $set: { verified: true } });

	logger.debug(`Merging contacts for visitor ${visitorId} and room ${roomId}`);

	const mergeContactsResult = await mergeContacts(contactId, { visitorId, source: room.source });

	logger.debug(`Finding inquiry for room ${roomId}`);
	const inquiry = await LivechatInquiry.findOneReadyByRoomId(roomId);
	if (!inquiry) {
		throw new Error('error-invalid-inquiry');
	}

	logger.debug(`Saving inquiry for room ${roomId}`);
	await saveQueueInquiry(inquiry);

	logger.debug(
		`Contact channel for contact ${contactId}, visitor ${visitorId} and room ${roomId} has been verified and merged successfully`,
	);
	return mergeContactsResult;
};

verifyContactChannel.patch(runVerifyContactChannel, () => License.hasModule('contact-id-verification'));
