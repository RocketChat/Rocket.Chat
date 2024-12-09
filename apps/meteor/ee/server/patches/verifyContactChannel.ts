import { LivechatInquiryStatus } from '@rocket.chat/core-typings';
import type { ILivechatContact, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { LivechatContacts, LivechatInquiry, LivechatRooms } from '@rocket.chat/models';

import { QueueManager } from '../../../app/livechat/server/lib/QueueManager';
import { mergeContacts } from '../../../app/livechat/server/lib/contacts/mergeContacts';
import { verifyContactChannel } from '../../../app/livechat/server/lib/contacts/verifyContactChannel';
import { client, shouldRetryTransaction } from '../../../server/database/utils';
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
		session.startTransaction();
		logger.debug({ msg: 'Start verifying contact channel', contactId, visitorId, roomId });

		const updater = LivechatContacts.getUpdater();
		LivechatContacts.setVerifiedUpdateQuery(true, updater);
		LivechatContacts.setFieldAndValueUpdateQuery(field, value.toLowerCase(), updater);
		await LivechatContacts.updateFromUpdaterByAssociation({ visitorId, source: room.source }, updater, { session });

		await LivechatRooms.update({ _id: roomId }, { $set: { verified: true } }, { session });
		logger.debug({ msg: 'Merging contacts', contactId, visitorId, roomId });

		const mergeContactsResult = await mergeContacts(contactId, { visitorId, source: room.source }, session);

		await session.commitTransaction();

		return mergeContactsResult;
	} catch (e) {
		await session.abortTransaction();
		if (shouldRetryTransaction(e) && attempts > 0) {
			logger.debug({ msg: 'Retrying to verify contact channel', contactId, visitorId, roomId });
			return _verifyContactChannel(params, room, attempts - 1);
		}

		logger.error({ msg: 'Error verifying contact channel', contactId, visitorId, roomId, error: e });
		throw new Error('error-verifying-contact-channel');
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

	const room = await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('error-invalid-room');
	}

	const result = await _verifyContactChannel(params, room);

	logger.debug({ msg: 'Finding inquiry', roomId });

	// Note: we are not using the session here since allowing the transactional flow to be used inside the
	//       saveQueueInquiry function would require a lot of changes across the codebase, so if we fail here we
	//       will not be able to rollback the transaction. That is not a big deal since the contact will be properly
	//       merged and the inquiry will be saved in the queue (will need to be taken manually by an agent though).
	const inquiry = await LivechatInquiry.findOneByRoomId(roomId);
	if (!inquiry) {
		// Note: if this happens, something is really wrong with the queue, so we should throw an error to avoid
		//       carrying on a weird state.
		throw new Error('error-invalid-inquiry');
	}

	if (inquiry.status === LivechatInquiryStatus.VERIFYING) {
		logger.debug({ msg: 'Verifying inquiry', roomId });
		await QueueManager.verifyInquiry(inquiry, room);
	}

	logger.debug({
		msg: 'Contact channel has been verified and merged successfully',
		contactId,
		visitorId,
		roomId,
	});

	return result;
};

verifyContactChannel.patch(runVerifyContactChannel, () => License.hasModule('contact-id-verification'));
