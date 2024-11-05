import type { ILivechatContact, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatInquiry, LivechatRooms } from '@rocket.chat/models';

import { Livechat } from '../../../app/livechat/server/lib/LivechatTyped';
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

	await LivechatContacts.updateContactChannel(visitorId, {
		verified: true,
		verifiedAt: new Date(),
		field,
		value: value.toLowerCase(),
	});

	const { value: room } = await LivechatRooms.findOneAndUpdate({ _id: roomId }, { $set: { verified: true } });

	Livechat.notifyRoomUpdated(room as IOmnichannelRoom);

	const mergeContactsResult = await mergeContacts(contactId, visitorId);

	const inquiry = await LivechatInquiry.findOneReadyByContactId(contactId);
	if (!inquiry) {
		throw new Error('error-invalid-inquiry');
	}

	await saveQueueInquiry(inquiry);

	return mergeContactsResult;
};

verifyContactChannel.patch(runVerifyContactChannel, () => License.hasModule('contact-id-verification'));
