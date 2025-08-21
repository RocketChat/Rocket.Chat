import type { IMediaCall, IMediaCallChannel } from '@rocket.chat/core-typings';
import type { ClientMediaSignal, ServerMediaSignalNewCall } from '@rocket.chat/media-signaling';

import { UserActorAgent } from './BaseAgent';
import { UserActorCallerSignalProcessor } from './CallerSignalProcessor';
import { logger } from '../../logger';
import type { MinimalUserData } from '../definition/common';

export class UserActorCallerAgent extends UserActorAgent {
	constructor(user: MinimalUserData) {
		super(user, 'caller');
	}

	public async onCallCreated(call: IMediaCall): Promise<void> {
		logger.debug({ msg: 'UserActorCallerAgent.onCallCreated', call });
		const { caller } = call;

		if (!caller.contractId) {
			throw new Error('error-invalid-contract');
		}

		// Pre-create the channel for the contractId that requested the call
		await this.getOrCreateChannel(call, caller.contractId);

		return super.onCallCreated(call);
	}

	protected buildNewCallSignal(call: IMediaCall): ServerMediaSignalNewCall {
		return {
			...super.buildNewCallSignal(call),
			// Send back the caller requested Id so the client can match this call to its request
			...(call.callerRequestedId && { requestedCallId: call.callerRequestedId }),
		};
	}

	protected doProcessSignal(call: IMediaCall, channel: IMediaCallChannel, signal: ClientMediaSignal): Promise<void> {
		const signalProcessor = new UserActorCallerSignalProcessor(this, call, channel);
		return signalProcessor.processSignal(signal);
	}
}
