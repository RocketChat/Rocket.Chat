import type { IMediaCall } from '@rocket.chat/core-typings';

import { gateway } from '../../global/SignalGateway';
import { logger } from '../../logger';
import { BaseMediaCallAgent } from '../BaseAgent';

/**
 * This agent is used as a placeholder when a real agent can only exist in one specific server instance
 * What it does is send a notification to other instances reporting that a call has been updated;
 * The event will make every other instance check if they have an agent for this call in there and tell it to refresh its own state
 */
export class BroadcastActorAgent extends BaseMediaCallAgent {
	public async onCallAccepted(callId: string, _signedContractId: string): Promise<void> {
		logger.debug({ msg: 'BroadcastActorAgent.onCallAccepted', callId });

		this.reportCallUpdated(callId);
	}

	public async onCallEnded(callId: string): Promise<void> {
		logger.debug({ msg: 'BroadcastActorAgent.onCallEnded', callId });

		this.reportCallUpdated(callId);
	}

	public async onCallActive(callId: string): Promise<void> {
		logger.debug({ msg: 'BroadcastActorAgent.onCallActive', callId });

		this.reportCallUpdated(callId);
	}

	public async onCallCreated(call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'BroadcastActorAgent.onCallCreated', call });

		throw new Error('A new call may not be created through a broadcast agent.');
	}

	public async onRemoteDescriptionChanged(callId: string, description: RTCSessionDescriptionInit): Promise<void> {
		logger.debug({ msg: 'BroadcastActorAgent.onRemoteDescriptionChanged', callId, description });

		// Save the description to this actor's channels before notifying the update
		await super.onRemoteDescriptionChanged(callId, description);

		this.reportCallUpdated(callId);
	}

	public async onWebrtcAnswer(callId: string): Promise<void> {
		logger.debug({ msg: 'BroadcastActorAgent.onWebrtcAnswer', callId });

		this.reportCallUpdated(callId);
	}

	protected reportCallUpdated(callId: string): void {
		gateway.emitter.emit('callUpdated', callId);
	}
}
