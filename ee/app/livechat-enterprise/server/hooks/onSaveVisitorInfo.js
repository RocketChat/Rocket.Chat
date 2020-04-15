import { callbacks } from '../../../../../app/callbacks';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';
import LivechatPriority from '../../../models/server/models/LivechatPriority';

callbacks.add('livechat.saveInfo', (room, { user, room: oldRoom }) => {
	if (!room || !user) {
		return;
	}

	const { priorityId: oldPriorityId = null } = oldRoom;
	const { priorityId: newPriorityId = null } = room;
	if (oldPriorityId === newPriorityId) {
		return;
	}

	LivechatEnterprise.savePriorityOnRoom(room._id, user, LivechatPriority.findOneById(newPriorityId));
}, callbacks.priority.HIGH, 'livechat-on-save-visitor-info');
