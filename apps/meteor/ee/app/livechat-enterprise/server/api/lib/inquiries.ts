import { LivechatInquiry, Users, OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import { updateRoomSLA } from './sla';

export async function setSLAToInquiry({ userId, roomId, sla }: { userId: string; roomId: string; sla: string }): Promise<void> {
	const inquiry = await LivechatInquiry.findOneByRoomId(roomId, { projection: { status: 1 } });
	if (!inquiry || inquiry.status !== 'queued') {
		throw new Error('error-invalid-inquiry');
	}

	const slaData = sla && (await OmnichannelServiceLevelAgreements.findOneByIdOrName(sla));
	if (!slaData) {
		throw new Error('error-invalid-sla');
	}

	const user = await Users.findOneById(userId);
	if (!user) {
		throw new Error('error-invalid-user');
	}

	await updateRoomSLA(roomId, user, slaData);
}
