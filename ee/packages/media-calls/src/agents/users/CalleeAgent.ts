import type { IMediaCall, IMediaCallChannel } from '@rocket.chat/core-typings';
import type { ClientMediaSignal } from '@rocket.chat/media-signaling';

import { UserActorAgent } from './BaseAgent';
import { UserActorCalleeSignalProcessor } from './CalleeSignalProcessor';
import type { MinimalUserData } from '../definition/common';

export class UserActorCalleeAgent extends UserActorAgent {
	constructor(user: MinimalUserData) {
		super(user, 'callee');
	}

	protected doProcessSignal(call: IMediaCall, channel: IMediaCallChannel, signal: ClientMediaSignal): Promise<void> {
		const signalProcessor = new UserActorCalleeSignalProcessor(this, call, channel);
		return signalProcessor.processSignal(signal);
	}
}
