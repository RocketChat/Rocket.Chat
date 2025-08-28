import type { MediaCallContact } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { UserActorAgent } from './BaseUserAgent';
import { logger } from '../../logger';

export class UserActorCalleeAgent extends UserActorAgent {
	constructor(contact: MediaCallContact) {
		super(contact, 'callee');
	}

	public async onCallAccepted(callId: string, signedContractId: string): Promise<void> {
		await super.onCallAccepted(callId, signedContractId);

		const call = await MediaCalls.findOneById(callId);
		if (!call?.webrtcOffer) {
			return;
		}

		await this.sendSignal({
			callId,
			toContractId: signedContractId,
			type: 'remote-sdp',
			sdp: call.webrtcOffer,
		});
	}

	public async onRemoteDescriptionChanged(callId: string, description: RTCSessionDescriptionInit): Promise<void> {
		const call = await MediaCalls.findOneById(callId);
		if (call?.state !== 'accepted' || !call.webrtcOffer || !call.callee.contractId) {
			logger.error({ msg: 'Invalid call state', call });
			return;
		}

		await this.sendSignal({
			callId,
			toContractId: call.callee.contractId,
			type: 'remote-sdp',
			sdp: description,
		});
	}
}
