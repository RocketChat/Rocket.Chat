import { callbacks } from '../../../../../app/callbacks';
import { LivechatEnterprise } from '../lib/LivechatEnterprise';
import LivechatPriority from '../../../models/server/models/LivechatPriority';

callbacks.add('livechat.saveInfo', (room, { user, room: oldRoom }) => {
	if (!room || !user) {
		return;
	}
	const { omnichannel: { priority: currentPriority } = {} } = oldRoom;
	const { omnichannel: { priority: newPriority } = {} } = room;
	if ((!currentPriority && !newPriority) || (currentPriority && newPriority && currentPriority._id === newPriority._id)) {
		return;
	}
	LivechatEnterprise.savePriorityDataOnRooms(room._id, user, LivechatPriority.findOneById(newPriority && newPriority._id));
}, callbacks.priority.HIGH, 'livechat-on-save-visitor-info');
