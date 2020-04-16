import { callbacks } from '../../../../../app/callbacks';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';
import LivechatPriority from '../../../models/server/models/LivechatPriority';

callbacks.add('livechat.saveInfo', (room, { user, room: oldRoom }) => {
	if (!room || !user) {
		return room;
	}

	const { priorityId: oldPriorityId = null } = oldRoom;
	const { priorityId: newPriorityId = null } = room;
	if (oldPriorityId === newPriorityId) {
		return room;
	}

	const priority = newPriorityId && LivechatPriority.findOneById(newPriorityId, { fields: { dueTimeInMinutes: 1 } });
	LivechatEnterprise.updateInquiryPriority(room._id, user, priority);
}, callbacks.priority.HIGH, 'livechat-on-save-visitor-info');
