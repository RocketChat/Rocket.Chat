import { LivechatInquiry, Users, LivechatPriority } from '@rocket.chat/models';

import { hasPermissionAsync } from '../../../../../../app/authorization/server/functions/hasPermission';
import { LivechatEnterprise } from '../../lib/LivechatEnterprise';

export async function setPriorityToInquiry({ userId, roomId, priority }) {
	if (!(await hasPermissionAsync(userId, 'manage-livechat-priorities')) && !(await hasPermissionAsync(userId, 'view-l-room'))) {
		throw new Error('error-not-authorized');
	}
	const inquiry = await LivechatInquiry.findOneByRoomId(roomId, { projection: { status: 1 } });
	if (!inquiry || inquiry.status !== 'queued') {
		throw new Error('error-invalid-inquiry');
	}

	const priorityData = priority && (await LivechatPriority.findOneByIdOrName(priority));
	if (!priorityData) {
		throw new Error('error-invalid-priority');
	}

	LivechatEnterprise.updateRoomPriority(roomId, await Users.findOneById(userId, { projection: { username: 1 } }), priorityData);
}
