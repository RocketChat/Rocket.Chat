import type { ILivechatContact, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatInquiry, LivechatRooms } from '@rocket.chat/models';

import { saveQueueInquiry } from '../../../app/livechat/server/lib/QueueManager';
import { mergeContacts } from '../../../app/livechat/server/lib/contacts/mergeContacts';
import { verifyContactChannel } from '../../../app/livechat/server/lib/contacts/verifyContactChannel';

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

	const mergeContactsResult = await mergeContacts(contactId, { visitorId, source: room.source });

	const inquiry = await LivechatInquiry.findOneReadyByContactId(contactId);
	if (!inquiry) {
		throw new Error('error-invalid-inquiry');
	}

	await saveQueueInquiry(inquiry);

	return mergeContactsResult;
};

verifyContactChannel.patch(runVerifyContactChannel, () => License.hasModule('contact-id-verification'));
