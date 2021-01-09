import { AutoTransferMonitor } from '../lib/AutoTransferMonitor';
import { callbacks } from '../../../../../app/callbacks/server';
import { settings } from '../../../../../app/settings/server';
import { RoutingManager } from '../../../../../app/livechat/server/lib/RoutingManager';


const scheduleAutoTransferJob = async (roomId: string): Promise<any> => {
	if (!roomId || roomId.length <= 0) {
		return;
	}

	const timeout = settings.get('Livechat_auto_transfer_chat_if_no_response_routing');
	if (!timeout || timeout <= 0) {
		return;
	}

	await AutoTransferMonitor.Instance.startMonitoring(roomId, timeout as number);
};

const handleLivechatNewRoomCallback = async (room: any = {}): Promise<any> => {
	if (room && RoutingManager.getConfig().autoAssignAgent) {
		const { _id } = room;
		await scheduleAutoTransferJob(_id);
	}
	return room;
};

const handleAfterTakeInquiryCallback = async (inquiry: any = {}): Promise<any> => {
	if (inquiry && !RoutingManager.getConfig().autoAssignAgent) {
		const { rid } = inquiry;
		await scheduleAutoTransferJob(rid);
	}
	return inquiry;
};

const cancelAutoTransferJob = async (message: any = {}, room: any = {}): Promise<any> => {
	const { _id: rid, t } = room;
	const { token } = message;

	if (!rid || !message || rid === '' || t !== 'l' || token) {
		return;
	}

	await AutoTransferMonitor.Instance.stopMonitoring(rid);
};

settings.get('Livechat_auto_transfer_chat_if_no_response_routing', function(_, value) {
	if (!value || value === 0) {
		callbacks.remove('livechat.newRoom', 'livechat-schedule-auto-transfer-job');
		callbacks.remove('livechat.afterTakeInquiry', 'livechat-livechat-auto-transfer-job-inquiry');
		callbacks.remove('afterSaveMessage', 'livechat-cancel-auto-transfer-job');
		return;
	}

	callbacks.add('livechat.newRoom', handleLivechatNewRoomCallback, callbacks.priority.MEDIUM, 'livechat-schedule-auto-transfer-job');
	callbacks.add('livechat.afterTakeInquiry', handleAfterTakeInquiryCallback, callbacks.priority.MEDIUM, 'livechat-livechat-auto-transfer-job-inquiry');
	callbacks.add('afterSaveMessage', cancelAutoTransferJob, callbacks.priority.HIGH, 'livechat-cancel-auto-transfer-job');
});
