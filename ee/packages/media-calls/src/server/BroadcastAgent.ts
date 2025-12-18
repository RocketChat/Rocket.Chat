import type { IMediaCall } from '@rocket.chat/core-typings';
import type { ClientMediaSignalBody } from '@rocket.chat/media-signaling';

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
		this.reportCallUpdated({ callId });
	}

	public async onCallEnded(callId: string): Promise<void> {
		this.reportCallUpdated({ callId });
	}

	public async onCallActive(callId: string): Promise<void> {
		this.reportCallUpdated({ callId });
	}

	public async onCallCreated(call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'BroadcastActorAgent.onCallCreated', call, role: this.role });
		// there's no point in broadcasting onCallCreated as it can only be called from within the call provider
	}

	public async onRemoteDescriptionChanged(callId: string, _negotiationId: string): Promise<void> {
		this.reportCallUpdated({ callId });
	}

	public async onCallTransferred(callId: string): Promise<void> {
		this.reportCallUpdated({ callId });
	}

	public async onDTMF(callId: string, dtmf: string, duration: number): Promise<void> {
		this.reportCallUpdated({ callId, dtmf: { dtmf, duration } });
	}

	protected reportCallUpdated(params: { callId: string; dtmf?: ClientMediaSignalBody<'dtmf'> }): void {
		const { callId, ...otherParams } = params;

		if (this.provider?.callId === callId) {
			this.provider.reactToCallChanges(otherParams).catch(() => {
				getMediaCallServer().reportCallUpdate(params);
			});
			return;
		}

		getMediaCallServer().reportCallUpdate(params);
	}
}
