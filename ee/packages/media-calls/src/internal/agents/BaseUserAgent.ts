import type { IMediaCall, IMediaCallChannel } from '@rocket.chat/core-typings';
import type { ClientMediaSignal, ServerMediaSignal, ServerMediaSignalNewCall } from '@rocket.chat/media-signaling';

import { BaseMediaCallAgent } from '../../base/BaseAgent';
import { logger } from '../../logger';
import { getMediaCallServer } from '../../server/injection';

export abstract class UserActorAgent extends BaseMediaCallAgent {
	public async processSignal(call: IMediaCall, signal: ClientMediaSignal): Promise<void> {
		const channel = await this.getOrCreateChannel(call, signal.contractId, { acknowledged: true });

		return this.doProcessSignal(call, channel, signal);
	}

	public async sendSignal(signal: ServerMediaSignal): Promise<void> {
		getMediaCallServer().sendSignal(this.actorId, signal);
	}

	public async onCallAccepted(callId: string, signedContractId: string): Promise<void> {
		logger.debug({ msg: 'UserActorAgent.onCallAccepted', callId });

		return this.sendSignal({
			callId,
			type: 'notification',
			notification: 'accepted',
			signedContractId,
		});
	}

	public async onCallEnded(callId: string): Promise<void> {
		logger.debug({ msg: 'UserActorAgent.onCallEnded', callId });

		return this.sendSignal({
			callId,
			type: 'notification',
			notification: 'hangup',
		});
	}

	public async onCallActive(callId: string): Promise<void> {
		logger.debug({ msg: 'UserActorAgent.onCallActive', callId });

		return this.sendSignal({
			callId,
			type: 'notification',
			notification: 'active',
		});
	}

	public async onCallCreated(call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'UserActorAgent.onCallCreated', call });

		await this.sendSignal(this.buildNewCallSignal(call));
	}

	protected abstract doProcessSignal(call: IMediaCall, channel: IMediaCallChannel, signal: ClientMediaSignal): Promise<void>;

	protected buildNewCallSignal(call: IMediaCall): ServerMediaSignalNewCall {
		return {
			callId: call._id,
			type: 'new',
			service: call.service,
			kind: call.kind,
			role: this.role,
			contact: this.getOtherCallActor(call),
		};
	}
}
