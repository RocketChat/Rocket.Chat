import type { ILivechatContact, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatInquiry, LivechatRooms } from '@rocket.chat/models';
import type { MongoError } from 'mongodb';

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
	attempts = 2,
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
	} catch (e) {
		// TODO: Add logger
		console.log(e);
		await session.abortTransaction();
		// Dont propagate transaction errors
		if (
			(e as unknown as MongoError)?.errorLabels?.includes('UnknownTransactionCommitResult') ||
			(e as unknown as MongoError)?.errorLabels?.includes('TransientTransactionError')
		) {
			if (attempts > 0) {
				// TODO: Add logger
				return runVerifyContactChannel(_next, params, attempts - 1);
			}
		}

		return null;
	} finally {
		await session.endSession();
	}

	// Note: we are not using the session here since we are using the changes to allow for transactions in the
	//       saveQueueInquiry function would require a lot of changes across the codebase, so if we fail here we
	//       will not be able to rollback the transaction, but that is not a big deal since the contact will be properly
	//       merged and the inquiry will be saved in the queue (will need to be taken manually by an agent though).
	const inquiry = await LivechatInquiry.findOneReadyByRoomId(roomId);
	if (!inquiry) {
		throw new Error('error-invalid-inquiry');
	}

	await saveQueueInquiry(inquiry);

	return result;
};

verifyContactChannel.patch(runVerifyContactChannel, () => License.hasModule('contact-id-verification'));
