import type { IMediaCall, MediaCallContact } from '@rocket.chat/core-typings';
import type { ServerMediaSignalNewCall } from '@rocket.chat/media-signaling';
import { MediaCalls } from '@rocket.chat/models';

import { UserActorAgent } from './BaseUserAgent';
import { logger } from '../../logger';

export class UserActorCallerAgent extends UserActorAgent {
	constructor(contact: MediaCallContact) {
		super(contact, 'caller');
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

	public async onRemoteDescriptionChanged(callId: string, _description: RTCSessionDescriptionInit): Promise<void> {
		logger.debug({ msg: 'UserActorCallerAgent.onRemoteDescriptionChanged', callId });
		const call = await MediaCalls.findOneById(callId);

		if (call?.state !== 'accepted' || !call.webrtcAnswer) {
			return;
		}

		await this.sendSignal({
			callId,
			toContractId: call.caller.contractId,
			type: 'remote-sdp',
			sdp: call.webrtcAnswer,
		});
	}
}
