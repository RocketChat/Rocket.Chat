import type { IMediaCall } from '@rocket.chat/core-typings';

import { BaseMediaCallAgent } from '../base/BaseAgent';
import { logger } from '../logger';
import { getMediaCallServer } from './injection';
import type { BaseCallProvider } from '../base/BaseCallProvider';

/**
 * This agent doesn't implement any logic
 * What it does is send a notification to other instances reporting that a call has been updated;
 * Then if any server instance is keeping track of this call, it'll load its data from mongo and check what changed
 */
export class BroadcastActorAgent extends BaseMediaCallAgent {
	public provider: BaseCallProvider | null = null;

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
		// there's no point in broadcasting onCallCreated as it can only be called from within the call provider
	}

	public async onRemoteDescriptionChanged(callId: string, description: RTCSessionDescriptionInit): Promise<void> {
		logger.debug({ msg: 'BroadcastActorAgent.onRemoteDescriptionChanged', callId, description });

		this.reportCallUpdated(callId);
	}

	protected reportCallUpdated(callId: string): void {
		if (this.provider?.callId === callId) {
			this.provider.reactToCallChanges().catch(() => {
				getMediaCallServer().reportCallUpdate(callId);
			});
			return;
		}

		getMediaCallServer().reportCallUpdate(callId);
	}
}
