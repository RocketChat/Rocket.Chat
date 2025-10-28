import { LivechatInquiry, Users, OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import { updateRoomSLA } from './sla';

export async function setSLAToInquiry({ userId, roomId, sla }: { userId: string; roomId: string; sla?: string }): Promise<void> {
	const inquiry = await LivechatInquiry.findOneByRoomId(roomId, { projection: { status: 1 } });
	if (!inquiry || inquiry.status !== 'queued') {
		throw new Error('error-invalid-inquiry');
	}

	const slaData = sla && (await OmnichannelServiceLevelAgreements.findOneByIdOrName(sla));
	if (!slaData) {
		throw new Error('error-invalid-sla');
	}

	const user = await Users.findOneById(userId, { projection: { _id: 1, username: 1, name: 1 } });
	if (!user?.username) {
		throw new Error('error-invalid-user');
	}

	await updateRoomSLA(
		roomId,
		{
			_id: user._id,
			name: user.name || '',
			username: user.username,
		},
		slaData,
	);
}
