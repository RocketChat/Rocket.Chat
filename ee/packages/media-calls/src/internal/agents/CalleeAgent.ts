import type { MediaCallContact } from '@rocket.chat/core-typings';
import { MediaCallNegotiations } from '@rocket.chat/models';

import { UserActorAgent } from './BaseUserAgent';
import { logger } from '../../logger';

export class UserActorCalleeAgent extends UserActorAgent {
	constructor(contact: MediaCallContact) {
		super(contact, 'callee');
	}

	public async onCallAccepted(callId: string, signedContractId: string): Promise<void> {
		await super.onCallAccepted(callId, signedContractId);

		const negotiation = await MediaCallNegotiations.findLatestByCallId(callId);
		if (!negotiation?.offer) {
			logger.debug('The call was accepted but the webrtc offer is not yet available.');
			return;
		}

		await this.sendSignal({
			callId,
			toContractId: signedContractId,
			type: 'remote-sdp',
			sdp: negotiation.offer,
			negotiationId: negotiation._id,
		});
	}
}
