import type { IMessage, IOmnichannelRoom } from '@rocket.chat/core-typings';

import type { CloseRoomParams } from '../../../../../app/livechat/server/lib/LivechatTyped';
import { settings } from '../../../../../app/settings/server';
import { callbacks } from '../../../../../lib/callbacks';
import { AutoTransferChatScheduler } from '../lib/AutoTransferChatScheduler';
import { cbLogger } from '../lib/logger';

type LivechatCloseCallbackParams = {
	room: IOmnichannelRoom;
	options: CloseRoomParams['options'];
};

let autoTransferTimeout = 0;

const handleAfterCloseRoom = async (params: LivechatCloseCallbackParams): Promise<LivechatCloseCallbackParams> => {
	const { room } = params;

	const { _id: rid, autoTransferredAt, autoTransferOngoing } = room;

	if (!autoTransferTimeout || autoTransferTimeout <= 0) {
		return params;
	}

	if (autoTransferredAt) {
		return params;
	}

	if (!autoTransferOngoing) {
		return params;
	}

	await AutoTransferChatScheduler.unscheduleRoom(rid);
	return params;
};

settings.watch('Livechat_auto_transfer_chat_timeout', (value) => {
	autoTransferTimeout = value as number;
	if (!autoTransferTimeout || autoTransferTimeout === 0) {
		callbacks.remove('livechat.afterTakeInquiry', 'livechat-auto-transfer-job-inquiry');
		callbacks.remove('afterOmnichannelSaveMessage', 'livechat-cancel-auto-transfer-job-after-message');
		callbacks.remove('livechat.closeRoom', 'livechat-cancel-auto-transfer-on-close-room');
		return;
	}

	callbacks.add(
		'livechat.afterTakeInquiry',
		async ({ inquiry, room }): Promise<any> => {
			const { rid } = inquiry;
			if (!rid?.trim()) {
				return;
			}

			if (room.autoTransferredAt || room.autoTransferOngoing) {
				return inquiry;
			}

			cbLogger.info(`Room ${room._id} will be scheduled to be auto transfered after ${autoTransferTimeout} seconds`);
			await AutoTransferChatScheduler.scheduleRoom(rid, autoTransferTimeout as number);

			return inquiry;
		},
		callbacks.priority.MEDIUM,
		'livechat-auto-transfer-job-inquiry',
	);
	callbacks.add(
		'afterOmnichannelSaveMessage',
		async (message: IMessage, { room }): Promise<IMessage> => {
			const { _id: rid, autoTransferredAt, autoTransferOngoing } = room;
			const { token, t: messageType } = message;

			if (messageType) {
				// ignore system messages
				return message;
			}

			if (!autoTransferTimeout || autoTransferTimeout <= 0) {
				return message;
			}

			if (!message || token) {
				// ignore messages from visitors
				return message;
			}

			if (autoTransferredAt) {
				return message;
			}

			if (!autoTransferOngoing) {
				return message;
			}

			await AutoTransferChatScheduler.unscheduleRoom(rid);
			return message;
		},
		callbacks.priority.HIGH,
		'livechat-cancel-auto-transfer-job-after-message',
	);
	callbacks.add('livechat.closeRoom', handleAfterCloseRoom, callbacks.priority.HIGH, 'livechat-cancel-auto-transfer-on-close-room');
});
