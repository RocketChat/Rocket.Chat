import type { IUser, IRoom, IMessage } from '@rocket.chat/core-typings';

import { Reads } from '../../../../server/sdk';
import { ReadReceipt } from '../../../../server/lib/message-read-receipt/ReadReceipt';
import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../../app/settings/server';

callbacks.add(
	'afterReadMessages',
	(rid: IRoom['_id'], params: { uid: IUser['_id']; lastSeen?: Date; tmid?: IMessage['_id'] }) => {
		if (!settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}
		const { uid, lastSeen, tmid } = params;

		if (tmid) {
			Reads.readThread(uid, tmid);
		} else if (lastSeen) {
			ReadReceipt.markMessagesAsRead(rid, uid, lastSeen);
		}
	},
	callbacks.priority.MEDIUM,
	'message-read-receipt-afterReadMessages',
);
