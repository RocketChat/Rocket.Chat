import { AutoTransferChatScheduler } from '../lib/AutoTransferChatScheduler';
import { callbacks } from '../../../../../app/callbacks/server';
import { settings } from '../../../../../app/settings/server';
import { LivechatRooms } from '../../../../../app/models/server';

let autoTransferTimeout = 0;

const handleAfterTakeInquiryCallback = async (inquiry: any = {}): Promise<any> => {
	const { rid } = inquiry;
	if (!rid || !rid.trim()) {
		return;
	}

	if (!autoTransferTimeout || autoTransferTimeout <= 0) {
		return inquiry;
	}

	const room = LivechatRooms.findOneById(rid, { autoTransferredAt: 1, autoTransferOngoing: 1 });
	if (!room || room.autoTransferredAt || room.autoTransferOngoing) {
		return inquiry;
	}

	await AutoTransferChatScheduler.scheduleRoom(rid, autoTransferTimeout as number);

	return inquiry;
};

const handleAfterSaveMessage = async (message: any = {}, room: any = {}): Promise<any> => {
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

	await AutoTransferChatScheduler.unscheduleRoom(rid);
	return message;
};


const handleAfterCloseRoom = async (room: any = {}): Promise<any> => {
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

	await AutoTransferChatScheduler.unscheduleRoom(rid);
	return room;
};

settings.get('Livechat_auto_transfer_chat_timeout', function(_, value) {
	autoTransferTimeout = value as number;
	if (!autoTransferTimeout || autoTransferTimeout === 0) {
		callbacks.remove('livechat.afterTakeInquiry', 'livechat-auto-transfer-job-inquiry');
		callbacks.remove('afterSaveMessage', 'livechat-cancel-auto-transfer-job-after-message');
		callbacks.remove('livechat.closeRoom', 'livechat-cancel-auto-transfer-on-close-room');
		return;
	}

	callbacks.add('livechat.afterTakeInquiry', handleAfterTakeInquiryCallback, callbacks.priority.MEDIUM, 'livechat-auto-transfer-job-inquiry');
	callbacks.add('afterSaveMessage', handleAfterSaveMessage, callbacks.priority.HIGH, 'livechat-cancel-auto-transfer-job-after-message');
	callbacks.add('livechat.closeRoom', handleAfterCloseRoom, callbacks.priority.HIGH, 'livechat-cancel-auto-transfer-on-close-room');
});
