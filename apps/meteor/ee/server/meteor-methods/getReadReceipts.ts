import { ClientSafeError } from '@rocket.chat/core-services';
import type { IReadReceiptWithUser, IMessage } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { Messages } from '@rocket.chat/models';
import { check } from 'meteor/check';

import { canAccessRoomIdAsync } from '../../../server/lib/authorization/canAccessRoom';
import { ReadReceipt } from '../lib/message-read-receipt/ReadReceipt';

export const getReadReceiptsFunction = async function (messageId: IMessage['_id'], userId: string): Promise<IReadReceiptWithUser[]> {
	if (!License.hasModule('message-read-receipt')) {
		throw new ClientSafeError('error-action-not-allowed', 'This is an enterprise feature', { method: 'getReadReceipts' });
	}
	check(messageId, String);

	const message = await Messages.findOneById(messageId, { projection: { _id: 1, rid: 1, receiptsArchived: 1 } });
	if (!message) {
		throw new ClientSafeError('error-invalid-message', 'Invalid message', {
			method: 'getReadReceipts',
		});
	}

	if (!(await canAccessRoomIdAsync(message.rid, userId))) {
		throw new ClientSafeError('error-invalid-room', 'Invalid room', { method: 'getReadReceipts' });
	}

	return ReadReceipt.getReceipts(message);
};
