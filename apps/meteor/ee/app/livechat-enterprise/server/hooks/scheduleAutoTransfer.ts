import { IMessage, IRoom } from '@rocket.chat/core-typings';

import { AutoTransferChatScheduler } from '../lib/AutoTransferChatScheduler';
import { callbacks } from '../../../../../lib/callbacks';
import { settings } from '../../../../../app/settings/server';
import { LivechatRooms } from '../../../../../app/models/server';
import { cbLogger } from '../lib/logger';

let autoTransferTimeout = 0;

const handleAfterTakeInquiryCallback = async (inquiry: any = {}): Promise<any> => {
	const { rid } = inquiry;
	if (!rid || !rid.trim()) {
		cbLogger.debug('Skipping callback. Invalid room id');
		return;
	}

	if (!autoTransferTimeout || autoTransferTimeout <= 0) {
		cbLogger.debug('Skipping callback. No auto transfer timeout or invalid value from setting');
		return inquiry;
	}

	const room = LivechatRooms.findOneById(rid, { autoTransferredAt: 1, autoTransferOngoing: 1 });
	if (!room || room.autoTransferredAt || room.autoTransferOngoing) {
		cbLogger.debug(`Skipping callback. Room ${room._id} already being transfered or not found`);
		return inquiry;
	}

	cbLogger.debug(`Callback success. Room ${room._id} will be scheduled to be auto transfered after ${autoTransferTimeout} seconds`);
	await AutoTransferChatScheduler.scheduleRoom(rid, autoTransferTimeout as number);

	return inquiry;
};

const handleAfterSaveMessage = (message: any = {}, room: any = {}): IMessage => {
	const { _id: rid, t, autoTransferredAt, autoTransferOngoing } = room;
	const { token } = message;

	if (!autoTransferTimeout || autoTransferTimeout <= 0) {
		return message;
	}

	if (!rid || !message || rid === '' || t !== 'l' || token) {
		return message;
	}

	if (autoTransferredAt) {
		return message;
	}

	if (!autoTransferOngoing) {
		return message;
	}

	Promise.await(AutoTransferChatScheduler.unscheduleRoom(rid));
	return message;
};

const handleAfterCloseRoom = (room: any = {}): IRoom => {
	const { _id: rid, autoTransferredAt, autoTransferOngoing } = room;

	if (!autoTransferTimeout || autoTransferTimeout <= 0) {
		return room;
	}

	if (autoTransferredAt) {
		return room;
	}

	if (!autoTransferOngoing) {
		return room;
	}

	Promise.await(AutoTransferChatScheduler.unscheduleRoom(rid));
	return room;
};

settings.watch('Livechat_auto_transfer_chat_timeout', function (value) {
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
