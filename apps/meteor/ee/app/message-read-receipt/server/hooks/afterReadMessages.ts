import { MessageReads } from '@rocket.chat/core-services';
import type { IUser, IRoom, IMessage } from '@rocket.chat/core-typings';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { ReadReceipt } from '../../../../server/lib/message-read-receipt/ReadReceipt';

callbacks.add(
	'afterReadMessages',
	async (rid: IRoom['_id'], params: { uid: IUser['_id']; lastSeen?: Date; tmid?: IMessage['_id'] }) => {
		if (!settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}
		const { uid, lastSeen, tmid } = params;

		if (tmid) {
			await MessageReads.readThread(uid, tmid);
		} else if (lastSeen) {
			await ReadReceipt.markMessagesAsRead(rid, uid, lastSeen);
		}
	},
	callbacks.priority.MEDIUM,
	'message-read-receipt-afterReadMessages',
);
