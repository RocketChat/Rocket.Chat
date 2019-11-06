import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../callbacks';
import { LivechatDepartment } from '../../../models';

callbacks.add('livechat.beforeCloseRoom', (room) => {
	const { departmentId } = room;
	if (!departmentId) {
		return room;
	}

	const department = LivechatDepartment.findOneById(departmentId);
	if (!department || !department.tagRequiredWhenClosingChat) {
		return room;
	}

	if (room.tags && room.tags.length > 0) {
		return room;
	}

	throw new Meteor.Error('error-tags-must-be-assigned-before-closing-chat', 'Tag(s) must be assigned before closing the chat', { method: 'livechat.beforeCloseRoom' });
}, callbacks.priority.HIGH, 'livechat-before-close-Room');
