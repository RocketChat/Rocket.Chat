import { callbacks } from '../../../../../app/callbacks';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';

callbacks.add('livechat.saveInfo', async (room, user) => {
	if (!room || !user) {
		return;
	}
	LivechatEnterprise.savePriorityDataOnRooms(room, user);
}, callbacks.priority.HIGH, 'livechat-on-save-visitor-info');
