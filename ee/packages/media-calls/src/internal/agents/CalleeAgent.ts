import type { IMediaCall, IMediaCallChannel, MediaCallContact } from '@rocket.chat/core-typings';
import type { ClientMediaSignal } from '@rocket.chat/media-signaling';
import { MediaCallChannels } from '@rocket.chat/models';

import { UserActorAgent } from './BaseUserAgent';
import { UserActorCalleeSignalProcessor } from './CalleeSignalProcessor';

export class UserActorCalleeAgent extends UserActorAgent {
	constructor(contact: MediaCallContact) {
		super(contact, 'callee');
	}

	protected doProcessSignal(call: IMediaCall, channel: IMediaCallChannel, signal: ClientMediaSignal): Promise<void> {
		const signalProcessor = new UserActorCalleeSignalProcessor(this, call, channel);
		return signalProcessor.processSignal(signal);
	}

	public async onCallAccepted(callId: string, signedContractId: string): Promise<void> {
		await super.onCallAccepted(callId, signedContractId);

		const channel = await MediaCallChannels.findOneByCallIdAndSignedActor({ callId, ...this.actor, contractId: signedContractId });
		if (!channel) {
			return;
		}

		if (channel.remoteDescription) {
			await this.sendSignal({
				callId,
				toContractId: signedContractId,
				type: 'remote-sdp',
				sdp: channel.remoteDescription,
			});
		}
	}

	public async onWebrtcAnswer(_callId: string): Promise<void> {
		// The callee doesn't need to do anything when the answer is ready
	}
}
