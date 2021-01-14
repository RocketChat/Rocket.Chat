import { AutoTransferChatScheduler } from '../lib/AutoTransferChatScheduler';
import { callbacks } from '../../../../../app/callbacks/server';
import { settings } from '../../../../../app/settings/server';
import { LivechatRooms } from '../../../../../app/models/server';


const handleAfterTakeInquiryCallback = async (inquiry: any = {}): Promise<any> => {
	const { rid } = inquiry;
	if (!rid || !rid.trim()) {
		return;
	}

	const timeout = settings.get('Livechat_auto_transfer_chat_timeout');
	if (!timeout || timeout <= 0) {
		return inquiry;
	}

	const room = await LivechatRooms.findOneById(rid);
	const { autoTransferredAt } = room;
	if (autoTransferredAt) {
		return inquiry;
	}

	await AutoTransferChatScheduler.scheduleRoom(rid, timeout as number);

	return inquiry;
};

const handleAfterSaveMessage = async (message: any = {}, room: any = {}): Promise<any> => {
	const { _id: rid, t } = room;
	const { token } = message;

	if (!rid || !message || rid === '' || t !== 'l' || token) {
		return;
	}

	await AutoTransferChatScheduler.unscheduleRoom(rid);
};

callbacks.add('livechat.afterTakeInquiry', handleAfterTakeInquiryCallback, callbacks.priority.MEDIUM, 'livechat-livechat-auto-transfer-job-inquiry');
callbacks.add('afterSaveMessage', handleAfterSaveMessage, callbacks.priority.HIGH, 'livechat-cancel-auto-transfer-job');
