import { callbacks } from '../../../../lib/callbacks';
import { LivechatDepartment } from '../../../models/server/index';

type RoomData = {
	departmentId: string;
	tags: string[];
};

const concatUnique = (...arrays: string[][]): string[] => [...new Set(...arrays.filter(Array.isArray))];

const normalizeParams = (
	params: { room: RoomData; options: { clientAction: string; tags: string[] } },
	tags: string[] = [],
): { room: RoomData; options: { clientAction: string; tags: string[] } } => Object.assign(params, { extraData: { tags } });

callbacks.add(
	'livechat.beforeCloseRoom',
	(originalParams: { room: RoomData; options: { clientAction: string; tags: string[] } }) => {
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
			throw new Error('error-tags-must-be-assigned-before-closing-chat');
		}

		return normalizeParams({ ...originalParams }, extraRoomTags);
	},
	callbacks.priority.HIGH,
	'livechat-before-close-Room',
);
