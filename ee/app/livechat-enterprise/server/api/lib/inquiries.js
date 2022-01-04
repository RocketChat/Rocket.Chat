import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import LivechatPriority from '../../../../models/server/raw/LivechatPriority';
import { LivechatInquiry, Users } from '../../../../../../app/models/server/raw';
import { LivechatEnterprise } from '../../lib/LivechatEnterprise';

export async function setPriorityToInquiry({ userId, roomId, priority }) {
	if (!(await hasPermissionAsync(userId, 'manage-livechat-priorities')) && !(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}
	const inquiry = await LivechatInquiry.findOneByRoomId(roomId, { fields: { status: 1 } });
	if (!inquiry || inquiry.status !== 'queued') {
		throw new Error('error-invalid-inquiry');
	}

	const priorityData = priority && (await LivechatPriority.findOneByIdOrName(priority));
	if (!priorityData) {
		throw new Error('error-invalid-priority');
	}

	LivechatEnterprise.updateRoomPriority(roomId, await Users.findOneById(userId, { fields: { username: 1 } }), priorityData);
}
