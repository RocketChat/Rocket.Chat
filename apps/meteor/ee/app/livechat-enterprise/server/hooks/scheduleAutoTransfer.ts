import type { IMessage, IOmnichannelRoom, IRoom } from '@rocket.chat/core-typings';
import { isOmnichannelRoom } from '@rocket.chat/core-typings';
import { LivechatRooms } from '@rocket.chat/models';

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

const handleAfterTakeInquiryCallback = async (inquiry: any = {}): Promise<any> => {
	const { rid } = inquiry;
	if (!rid?.trim()) {
		return;
	}

	if (!autoTransferTimeout || autoTransferTimeout <= 0) {
		return inquiry;
	}

	const room = await LivechatRooms.findOneById(rid, { projection: { _id: 1, autoTransferredAt: 1, autoTransferOngoing: 1 } });
	if (!room) {
		return inquiry;
	}

	if (room.autoTransferredAt || room.autoTransferOngoing) {
		return inquiry;
	}

	cbLogger.info(`Room ${room._id} will be scheduled to be auto transfered after ${autoTransferTimeout} seconds`);
	await AutoTransferChatScheduler.scheduleRoom(rid, autoTransferTimeout as number);

	return inquiry;
};

const handleAfterSaveMessage = async (message: IMessage, room: IRoom | undefined): Promise<IMessage> => {
	if (!room || !isOmnichannelRoom(room)) {
		return message;
	}

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
};

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
		callbacks.remove('afterSaveMessage', 'livechat-cancel-auto-transfer-job-after-message');
		callbacks.remove('livechat.closeRoom', 'livechat-cancel-auto-transfer-on-close-room');
		return;
	}

	callbacks.add(
		'livechat.afterTakeInquiry',
		handleAfterTakeInquiryCallback,
		callbacks.priority.MEDIUM,
		'livechat-auto-transfer-job-inquiry',
	);
	callbacks.add('afterSaveMessage', handleAfterSaveMessage, callbacks.priority.HIGH, 'livechat-cancel-auto-transfer-job-after-message');
	callbacks.add('livechat.closeRoom', handleAfterCloseRoom, callbacks.priority.HIGH, 'livechat-cancel-auto-transfer-on-close-room');
});
