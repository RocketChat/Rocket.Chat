import type { ILivechatContact, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatInquiry, LivechatRooms } from '@rocket.chat/models';
import type { MongoError } from 'mongodb';

import { saveQueueInquiry } from '../../../app/livechat/server/lib/QueueManager';
import { mergeContacts } from '../../../app/livechat/server/lib/contacts/mergeContacts';
import { verifyContactChannel } from '../../../app/livechat/server/lib/contacts/verifyContactChannel';
import { client } from '../../../server/database/utils';
import { contactLogger as logger } from '../../app/livechat-enterprise/server/lib/logger';

type VerifyContactChannelParams = {
	contactId: string;
	field: string;
	value: string;
	visitorId: string;
	roomId: string;
};

async function _verifyContactChannel(
	params: VerifyContactChannelParams,
	room: Pick<IOmnichannelRoom, '_id' | 'source'>,
	attempts = 2,
): Promise<ILivechatContact | null> {
	const { contactId, field, value, visitorId, roomId } = params;

	const session = client.startSession();
	try {
		logger.debug({ msg: 'Start verifying contact channel', contactId, visitorId, roomId });

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
		logger.debug({ msg: 'Merging contacts', contactId, visitorId, roomId });

		const mergeContactsResult = await mergeContacts(contactId, { visitorId, source: room.source }, session);

		await session.commitTransaction();

		return mergeContactsResult;
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
				return _verifyContactChannel(params, room, attempts - 1);
			}
		}

		return null;
	} finally {
		await session.endSession();
	}
}

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
	const { roomId, contactId, visitorId } = params;

	const room = await LivechatRooms.findOneById<Pick<IOmnichannelRoom, '_id' | 'source'>>(roomId, { projection: { source: 1 } });
	if (!room) {
		throw new Error('error-invalid-room');
	}

	const result = await _verifyContactChannel(params, room);
	if (!result) {
		return null;
	}

	// Note: we are not using the session here since allowing the transactional flow to be used inside the
	//       saveQueueInquiry function would require a lot of changes across the codebase, so if we fail here we
	//       will not be able to rollback the transaction. That is not a big deal since the contact will be properly
	//       merged and the inquiry will be saved in the queue (will need to be taken manually by an agent though).
	logger.debug({ msg: 'Finding inquiry', roomId });
	const inquiry = await LivechatInquiry.findOneReadyByRoomId(roomId);
	if (!inquiry) {
		// Note: if this happens, something is really wrong with the queue, so we should throw an error to avoid
		//       carrying on a weird state.
		throw new Error('error-invalid-inquiry');
	}

	logger.debug({ msg: 'Saving inquiry', roomId });
	await saveQueueInquiry(inquiry);

	logger.debug({
		msg: 'Contact channel has been verified and merged successfully',
		contactId,
		visitorId,
		roomId,
	});

	return result;
};

verifyContactChannel.patch(runVerifyContactChannel, () => License.hasModule('contact-id-verification'));
