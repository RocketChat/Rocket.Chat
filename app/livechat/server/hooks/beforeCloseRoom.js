import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../callbacks';
import { LivechatDepartment } from '../../../models';

const concatUnique = (...arrays) => [...new Set([].concat(...arrays.filter(Array.isArray)))];

callbacks.add('livechat.beforeCloseRoom', ({ room, options }) => {
	const { departmentId, tags: roomTags } = room;
	if (!departmentId) {
		return;
	}

	const department = LivechatDepartment.findOneById(departmentId);
	if (!department) {
		return;
	}

	const { requestTagBeforeClosingChat, chatClosingTags } = department;
	const extraData = {
		tags: concatUnique(roomTags, chatClosingTags),
	};

	if (!requestTagBeforeClosingChat) {
		return extraData;
	}

	const { clientAction } = options;
	const checkRoomTags = !clientAction || (roomTags && roomTags.length > 0);
	const checkDepartmentTags = chatClosingTags && chatClosingTags.length > 0;
	if (!checkRoomTags || !checkDepartmentTags) {
		throw new Meteor.Error('error-tags-must-be-assigned-before-closing-chat', 'Tag(s) must be assigned before closing the chat', { method: 'livechat.beforeCloseRoom' });
	}

	return extraData;
}, callbacks.priority.HIGH, 'livechat-before-close-Room');
