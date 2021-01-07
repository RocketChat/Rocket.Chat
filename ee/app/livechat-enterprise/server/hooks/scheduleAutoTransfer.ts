import { AutoTransferMonitor } from '../lib/AutoTransferMonitor';
import { callbacks } from '../../../../../app/callbacks/server';
import { settings } from '../../../../../app/settings/server';


const scheduleAutoTransferJob = async (room: any = {}): Promise<any> => {
	if (!room) {
		return;
	}

	const timeout = settings.get('Livechat_auto_transfer_chat_if_no_response_routing');
	if (!timeout || timeout <= 0) {
		return;
	}

	await AutoTransferMonitor.Instance.startMonitoring(room, timeout as number);

	return room;
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
		callbacks.remove('afterSaveMessage', 'livechat-cancel-auto-transfer-job');
		return;
	}

	callbacks.add('livechat.newRoom', scheduleAutoTransferJob, callbacks.priority.MEDIUM, 'livechat-schedule-auto-transfer-job');
	callbacks.add('afterSaveMessage', cancelAutoTransferJob, callbacks.priority.MEDIUM, 'livechat-cancel-auto-transfer-job');
});
