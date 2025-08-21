import { MediaCalls } from '@rocket.chat/models';

import { UserActorSignalProcessor } from './BaseSignalProcessor';
import { MediaCallDirector } from '../../global/CallDirector';
import { logger } from '../../logger';

export class UserActorCalleeSignalProcessor extends UserActorSignalProcessor {
	protected async clientIsReachable(): Promise<void> {
		logger.debug({ msg: 'UserActorCalleeAgent.clientIsReachable' });
		if (this.call.state !== 'none') {
			return;
		}

		// Change the call state from 'none' to 'ringing' when any callee session is found
		await MediaCalls.startRingingById(this.call._id, MediaCallDirector.getNewExpirationTime());
	}

	protected async clientHasRejected(): Promise<void> {
		logger.debug({ msg: 'UserActorCalleeAgent.clientHasRejected' });

		if (!this.isCallPending()) {
			return;
		}

		return MediaCallDirector.hangup(this.call, this.agent, 'rejected');
	}

	protected async clientIsUnavailable(): Promise<void> {
		logger.debug({ msg: 'UserActorCalleeAgent.clientIsUnavailable' });

		// We don't do anything on unavailable responses from clients, as a different client may still answer
	}

	protected async clientHasAccepted(): Promise<void> {
		logger.debug({ msg: 'UserActorCalleeAgent.clientHasAccepted' });

		if (!this.isCallPending()) {
			return;
		}

		await MediaCallDirector.acceptCall(this.call, this.agent, this.contractId);
	}
}
