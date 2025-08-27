import { UserActorSignalProcessor } from './BaseSignalProcessor';
import { logger } from '../../logger';

export class UserActorCallerSignalProcessor extends UserActorSignalProcessor {
	protected async clientIsReachable(): Promise<void> {
		logger.debug({ msg: 'UserActorCallerAgent.clientIsReachable' });

		// The caller contract should be signed before the call even starts, so if this one isn't, ignore its state
		if (!this.signed) {
			return;
		}

		// When the signed caller's client is reached, we immediatelly send the first offer request
		await this.requestWebRTCOffer({ iceRestart: false });
	}

	protected async clientHasRejected(): Promise<void> {
		logger.debug({ msg: 'UserActorCallerAgent.clientHasRejected' });

		// Ignore rejections coming from the caller's client
	}

	protected async clientIsUnavailable(): Promise<void> {
		logger.debug({ msg: 'UserActorCallerAgent.clientIsUnavailable' });

		// Ignore unavailable caller clients
	}

	protected async clientHasAccepted(): Promise<void> {
		logger.debug({ msg: 'UserActorCallerAgent.clientHasAccepted' });

		// The caller has nothing to accept
	}
}
