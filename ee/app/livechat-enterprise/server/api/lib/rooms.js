import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import LivechatPriority from '../../../../models/server/raw/LivechatPriority';
import { LivechatRooms, Users } from '../../../../../../app/models/server/raw';
import { LivechatEnterprise } from '../../lib/LivechatEnterprise';

export async function setPriorityToRoom({ userId, roomId, priorityId }) {
	if (!await hasPermissionAsync(userId, 'manage-livechat-priorities') && !await hasPermissionAsync(userId, 'view-l-room')) {
		throw new Error('error-not-authorized');
	}
	const room = roomId && await LivechatRooms.findOneById(roomId);
	if (!room) {
		throw new Error('error-invalid-room');
	}
	const priority = priorityId && await LivechatPriority.findOneById(priorityId);
	if (!priority) {
		throw new Error('error-invalid-priority');
	}
	await LivechatRooms.setPriorityById(roomId, priority);
	LivechatEnterprise.savePriorityDataOnRooms(roomId, await Users.findOneById(userId, { fields: { username: 1 } }), priority);
}
