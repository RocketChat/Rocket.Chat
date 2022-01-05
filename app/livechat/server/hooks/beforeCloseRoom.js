import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../lib/callbacks';
import { LivechatDepartment } from '../../../models';

const concatUnique = (...arrays) => [...new Set([].concat(...arrays.filter(Array.isArray)))];

const normalizeParams = (params, tags = []) => Object.assign(params, { extraData: { tags } });

callbacks.add(
	'livechat.beforeCloseRoom',
	(originalParams = {}) => {
		const { room, options } = originalParams;
		const { departmentId, tags: optionsTags } = room;
		const { clientAction, tags: oldRoomTags } = options;
		const roomTags = concatUnique(oldRoomTags, optionsTags);

		if (!departmentId) {
			return normalizeParams({ ...originalParams }, roomTags);
		}

		const department = LivechatDepartment.findOneById(departmentId);
		if (!department) {
			return normalizeParams({ ...originalParams }, roomTags);
		}

		const { requestTagBeforeClosingChat, chatClosingTags } = department;
		const extraRoomTags = concatUnique(roomTags, chatClosingTags);

		if (!requestTagBeforeClosingChat) {
			return normalizeParams({ ...originalParams }, extraRoomTags);
		}

		const checkRoomTags = !clientAction || (roomTags && roomTags.length > 0);
		const checkDepartmentTags = chatClosingTags && chatClosingTags.length > 0;
		if (!checkRoomTags || !checkDepartmentTags) {
			throw new Meteor.Error('error-tags-must-be-assigned-before-closing-chat', 'Tag(s) must be assigned before closing the chat', {
				method: 'livechat.beforeCloseRoom',
			});
		}

		return normalizeParams({ ...originalParams }, extraRoomTags);
	},
	callbacks.priority.HIGH,
	'livechat-before-close-Room',
);
