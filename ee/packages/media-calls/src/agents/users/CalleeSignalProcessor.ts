import { MediaCallChannels, MediaCalls } from '@rocket.chat/models';

import { UserActorSignalProcessor } from './BaseSignalProcessor';
import { MediaCallDirector } from '../../global/CallDirector';
import { logger } from '../../logger';

export class UserActorCalleeSignalProcessor extends UserActorSignalProcessor {
	protected async clientIsReachable(): Promise<void> {
		logger.debug({ msg: 'UserActorCalleeSignalProcessor.clientIsReachable' });
		if (this.call.state !== 'none') {
			return;
		}

		// Change the call state from 'none' to 'ringing' when any callee session is found
		await MediaCalls.startRingingById(this.call._id, MediaCallDirector.getNewExpirationTime());
	}

	protected async clientHasRejected(): Promise<void> {
		logger.debug({ msg: 'UserActorCalleeSignalProcessor.clientHasRejected' });

		if (!this.isCallPending()) {
			return;
		}

		return MediaCallDirector.hangup(this.call, this.agent, 'rejected');
	}

	protected async clientIsUnavailable(): Promise<void> {
		logger.debug({ msg: 'UserActorCalleeSignalProcessor.clientIsUnavailable' });

		// We don't do anything on unavailable responses from clients, as a different client may still answer
	}

	protected async clientHasAccepted(): Promise<void> {
		logger.debug({ msg: 'UserActorCalleeSignalProcessor.clientHasAccepted' });

		if (!this.isCallPending()) {
			return;
		}

		await MediaCallDirector.acceptCall(this.call, this.agent, this.contractId);
	}

	protected async saveLocalDescription(sdp: RTCSessionDescriptionInit): Promise<void> {
		logger.debug({ msg: 'UserActorCalleeSignalProcessor.saveLocalDescription', sdp });

		await MediaCallChannels.setLocalDescription(this.channel._id, sdp);

		await MediaCallDirector.saveWebrtcSession(this.call, this.agent, sdp);
	}
}
