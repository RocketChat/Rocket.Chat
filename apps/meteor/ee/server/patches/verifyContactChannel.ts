import type { ILivechatContact, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatInquiry, LivechatRooms } from '@rocket.chat/models';

import { saveQueueInquiry } from '../../../app/livechat/server/lib/QueueManager';
import { mergeContacts } from '../../../app/livechat/server/lib/contacts/mergeContacts';
import { verifyContactChannel } from '../../../app/livechat/server/lib/contacts/verifyContactChannel';
import { client } from '../../../server/database/utils';

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

	const session = client.startSession();
	let result = null;
	try {
		session.startTransaction();
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
			{},
			{ session },
		);

		await LivechatRooms.update({ _id: roomId }, { $set: { verified: true } }, { session });

		const mergeContactsResult = await mergeContacts(contactId, { visitorId, source: room.source }, session);

		await session.commitTransaction();

		result = mergeContactsResult;
	} catch (error) {
		console.log(error);
		await session.abortTransaction();
		await session.endSession();
		return null;
	}

	await session.endSession();

	// Note: We should have a transaction here to ensure that the inquiry is saved only if the contact is successfully verified
	// but the current implementation uses events, so I am not sure how to procced;
	const inquiry = await LivechatInquiry.findOneReadyByRoomId(roomId);
	if (!inquiry) {
		throw new Error('error-invalid-inquiry');
	}

	await saveQueueInquiry(inquiry);

	return result;
};

verifyContactChannel.patch(runVerifyContactChannel, () => License.hasModule('contact-id-verification'));
