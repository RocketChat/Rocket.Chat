import { callbacks } from '../../../../../lib/callbacks';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';
import LivechatPriority from '../../../models/server/models/LivechatPriority';

callbacks.add(
	'livechat.saveInfo',
	(room, { user, oldRoom }) => {
		if (!room || !user) {
			return room;
		}

		const { priorityId: oldPriorityId = null } = oldRoom;
		const { priorityId: newPriorityId = null } = room;
		if (oldPriorityId === newPriorityId) {
			return room;
		}

		const priority = newPriorityId && LivechatPriority.findOneById(newPriorityId);
		LivechatEnterprise.updateRoomPriority(room._id, user, priority);

		return room;
	},
	callbacks.priority.HIGH,
	'livechat-on-save-visitor-info',
);
