import { LivechatInquiry, Users, OmnichannelServiceLevelAgreements } from '@rocket.chat/models';

import { LivechatEnterprise } from '../../lib/LivechatEnterprise';

export async function setSLAToInquiry({ userId, roomId, sla }: { userId: string; roomId: string; sla: string }): Promise<void> {
	const inquiry = await LivechatInquiry.findOneByRoomId(roomId, { projection: { status: 1 } });
	if (!inquiry || inquiry.status !== 'queued') {
		throw new Error('error-invalid-inquiry');
	}

	const slaData = sla && (await OmnichannelServiceLevelAgreements.findOneByIdOrName(sla));
	if (!slaData) {
		throw new Error('error-invalid-sla');
	}

	LivechatEnterprise.updateRoomSLA(roomId, await Users.findOneById(userId, { projection: { username: 1 } }), slaData);
}
