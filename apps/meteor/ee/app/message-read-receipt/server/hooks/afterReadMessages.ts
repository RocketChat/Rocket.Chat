import { MessageReads } from '@rocket.chat/core-services';
import { type IUser, type IRoom, type IMessage, isRoomFederated } from '@rocket.chat/core-typings';

import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../server/lib/callbacks';
import { ReadReceipt } from '../../../../server/lib/message-read-receipt/ReadReceipt';

callbacks.add(
	'afterReadMessages',
	async (room: IRoom, params: { uid: IUser['_id']; lastSeen?: Date; tmid?: IMessage['_id'] }) => {
		if (!settings.get('Message_Read_Receipt_Enabled')) {
			return;
		}
		// Rooms federated are not supported yet
		if (isRoomFederated(room)) {
			return;
		}
		const { uid, lastSeen, tmid } = params;

		if (tmid) {
			await MessageReads.readThread(uid, tmid);
		} else if (lastSeen) {
			await ReadReceipt.markMessagesAsRead(room._id, uid, lastSeen);
		}
	},
	callbacks.priority.MEDIUM,
	'message-read-receipt-afterReadMessages',
);
