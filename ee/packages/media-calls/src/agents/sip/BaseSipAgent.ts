import type { IMediaCall, MediaCallSignedActor } from '@rocket.chat/core-typings';

import { gateway } from '../../global/SignalGateway';
import { logger } from '../../logger';
import { BaseMediaCallAgent } from '../BaseAgent';

export abstract class SipActorAgent extends BaseMediaCallAgent {
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
			id: this.actorId,
			contractId,
		};
	}

	public async onRemoteDescriptionChanged(callId: string, description: RTCSessionDescriptionInit): Promise<void> {
		await super.onRemoteDescriptionChanged(callId, description);
		gateway.emitter.emit('callUpdated', callId);
	}

	public async onWebrtcAnswer(callId: string): Promise<void> {
		logger.debug({ msg: 'SipActorAgent.onWebrtcAnswer', callId, role: this.role });
	}
}
