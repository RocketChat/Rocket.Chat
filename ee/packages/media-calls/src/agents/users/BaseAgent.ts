import type { IMediaCall, IMediaCallChannel } from '@rocket.chat/core-typings';
import type { CallRole, ClientMediaSignal, ServerMediaSignal, ServerMediaSignalNewCall } from '@rocket.chat/media-signaling';

import { gateway } from '../../global/SignalGateway';
import { logger } from '../../logger';
import { BaseMediaCallAgent } from '../BaseAgent';
import type { MinimalUserData } from '../definition/common';

export abstract class UserActorAgent extends BaseMediaCallAgent {
	constructor(
		protected readonly user: MinimalUserData,
		role: CallRole,
	) {
		super({
			type: 'user',
			id: user._id,
			role,
		});
	}

	public async processSignal(call: IMediaCall, signal: ClientMediaSignal): Promise<void> {
		const channel = await this.getOrCreateChannel(call, signal.contractId, { acknowledged: true });

		return this.doProcessSignal(call, channel, signal);
	}

	public async sendSignal(signal: ServerMediaSignal): Promise<void> {
		gateway.sendSignal(this.user._id, signal);
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
