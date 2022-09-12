import { LivechatInquiry, Users, LivechatPriority } from '@rocket.chat/models';

import { LivechatEnterprise } from '../../lib/LivechatEnterprise';

export async function setPriorityToInquiry({ userId, roomId, priority }) {
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
