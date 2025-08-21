import type { IMediaCall, IMediaCallChannel } from '@rocket.chat/core-typings';
import { MediaCallChannels, MediaCalls } from '@rocket.chat/models';

import type { SipServerSession } from './Session';
import { BaseCallProvider } from '../../../BaseCallProvider';
import type { SipActorAgent } from '../BaseSipAgent';

export abstract class BaseSipCall extends BaseCallProvider {
	protected lastCallState: IMediaCall['state'];

	protected remoteDescription: RTCSessionDescriptionInit | null;

	constructor(
		protected readonly session: SipServerSession,
		call: IMediaCall,
		protected readonly agent: SipActorAgent,
		protected readonly channel: IMediaCallChannel,
	) {
		super(call);
		this.lastCallState = 'none';
		this.remoteDescription = null;

		if (channel.remoteDescription) {
			this.remoteDescription = channel.remoteDescription;
		}
	}

	public async updateCall(_call: IMediaCall): Promise<void> {
		//
	}

	public async reactToCallChanges(): Promise<void> {
		// If we already knew this call was over, there's nothing more to reflect
		if (this.lastCallState === 'hangup') {
			return;
		}

		const freshCall = await MediaCalls.findOneById(this.call._id);
		if (!freshCall) {
			return;
		}

		// Don't do anything unless our agent has one of the call's signed actors
		const callActor = this.agent.getMyCallActor(freshCall);

		if (!this.agent.isRepresentingActor(callActor) || callActor.contractId !== this.session.sessionId) {
			return;
		}

		return this.reflectCall(freshCall);
	}

	protected async getChannelRemoteDescription(): Promise<RTCSessionDescriptionInit | null> {
		if (this.channel.remoteDescription) {
			return this.channel.remoteDescription;
		}

		const channel = await MediaCallChannels.findOneById(this.channel._id, { projection: { remoteDescription: 1 } });
		if (!channel?.remoteDescription) {
			return null;
		}

		return channel.remoteDescription;
	}

	protected abstract reflectCall(call: IMediaCall): Promise<void>;
}
