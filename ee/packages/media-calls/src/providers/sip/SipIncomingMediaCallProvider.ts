import type { IMediaCall, IMediaCallChannel, MediaCallActor, MediaCallContact, MediaCallSignedActor } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { CallRole } from '@rocket.chat/media-signaling';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { MediaCallChannels } from '@rocket.chat/models';

import { logger } from '../../logger';
import type { IMediaCallProvider } from '../IMediaCallProvider';
import { InternalServerError } from '../common';
import { BaseSipMediaCallProvider } from './BaseSipMediaCallProvider';

type IncomingCallEvents = {
	gotRemoteDescription: { description: RTCSessionDescriptionInit };
	callEnded: void;
	callFailed: void;
};

export class SipIncomingMediaCallProvider extends BaseSipMediaCallProvider implements IMediaCallProvider {
	public readonly providerName = 'sip.incoming';

	public readonly supportedRoles: CallRole[] = ['caller'];

	public readonly emitter: Emitter<IncomingCallEvents>;

	constructor(
		private readonly caller: MediaCallContact<MediaCallSignedActor<MediaCallActor<'sip'>>>,
		private readonly localDescription: RTCSessionDescriptionInit,
	) {
		super();
		this.emitter = new Emitter();
	}

	public async createCall(callee: MediaCallActor): Promise<IMediaCall> {
		logger.debug({ msg: 'SipIncomingMediaCallProvider.createCall', callee });

		return this.createIncomingCall(
			{
				caller: this.caller,
				callee,
			},
			this.caller,
		);
	}

	protected async reflectCall(this: SipIncomingMediaCallProviderWithCall, call: IMediaCall): Promise<void> {
		if (call.state === 'accepted' && this.lastCallState !== 'accepted') {
			this.requireChannelId();
			return this.processAcceptedCall();
		}

		if (call.state === 'hangup') {
			return this.processEndedCall();
		}
	}

	protected async processEndedCall(): Promise<void> {
		this.emitter.emit('callEnded');
		this.lastCallState = 'hangup';
	}

	protected async processAcceptedCall(this: SipIncomingMediaCallProviderWithChannel): Promise<void> {
		logger.debug({ msg: 'SipIncomingMediaCallProvider.processAcceptedCall', callId: this.callId });

		const channel = await MediaCallChannels.findOneById(this.channelId);
		if (!channel) {
			logger.error({
				msg: `Could not find the channel data`,
				method: 'SipIncomingMediaCallProvider.processAcceptedCall',
				callId: this.callId,
				lastCallState: this.lastCallState,
			});

			throw new InternalServerError('invalid-channel');
		}

		// If there's no remoteDescription on the channel yet, skip processing and retain the old call state
		// If we get a new update report, then this will all run again
		if (!channel.remoteDescription) {
			return;
		}

		this.emitter.emit('gotRemoteDescription', { description: channel.remoteDescription });
		this.lastCallState = 'accepted';
	}

	protected async createContract(this: SipIncomingMediaCallProviderWithCall): Promise<void> {
		logger.debug({ msg: 'SipIncomingMediaCallProvider.createContract', callId: this.callId });

		const newChannel: InsertionModel<IMediaCallChannel> = {
			callId: this.callId,
			state: 'none',
			role: 'caller',
			acknowledged: true,
			localDescription: this.localDescription,
			contact: this.caller,
			contractId: this.caller.contractId,
			actorType: 'sip',
			actorId: this.caller.id,
		};

		const result = await MediaCallChannels.insertOne(newChannel);
		if (!result.insertedId) {
			throw new InternalServerError('failed-to-insert-channel');
		}
		this.channelId = result.insertedId;
	}
}

abstract class SipIncomingMediaCallProviderWithCall extends SipIncomingMediaCallProvider {
	public abstract callId: string;
}
abstract class SipIncomingMediaCallProviderWithChannel extends SipIncomingMediaCallProviderWithCall {
	public abstract channelId: string;
}
