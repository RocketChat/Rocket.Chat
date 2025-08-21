import type { IMediaCall, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';

import { gateway } from '../../global/SignalGateway';
import { logger } from '../../logger';
import { BaseMediaCallAgent } from '../BaseAgent';
import type { SipUserData } from '../definition/common';

export abstract class SipActorAgent extends BaseMediaCallAgent {
	constructor(
		protected readonly user: SipUserData,
		role: CallRole,
	) {
		super({
			type: 'sip',
			id: user.id,
			role,
		});
	}

	public setLocalDescription(localDescription: RTCSessionDescriptionInit): void {
		this.localDescription = localDescription;
	}

	public async onCallAccepted(callId: string, signedContractId: string): Promise<void> {
		logger.debug({ msg: 'SipActorAgent.onCallAccepted', callId, signedContractId });
	}

	public async onCallEnded(callId: string): Promise<void> {
		logger.debug({ msg: 'SipActorAgent.onCallEnded', callId, role: this.role });
	}

	public async onCallActive(callId: string): Promise<void> {
		logger.debug({ msg: 'SipActorAgent.onCallActive', callId, role: this.role });
	}

	public async onCallCreated(call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'SipActorAgent.onCallCreated', call, role: this.role });
	}

	public getSignedActor(contractId: string): MediaCallSignedActor {
		return {
			type: 'user',
			id: this.user.id,
			contractId,
		};
	}

	public async onRemoteDescriptionChanged(callId: string, description: RTCSessionDescriptionInit): Promise<void> {
		await super.onRemoteDescriptionChanged(callId, description);
		gateway.emitter.emit('callUpdated', callId);
	}
}
