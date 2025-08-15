import type { IMediaCall, IMediaCallChannel, MediaCallActor, MediaCallContact, MediaCallSignedActor } from '@rocket.chat/core-typings';
import { Emitter } from '@rocket.chat/emitter';
import type { CallRole } from '@rocket.chat/media-signaling';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { MediaCallChannels, MediaCalls } from '@rocket.chat/models';

import { logger } from '../../logger';
import { BaseMediaCallProvider, type CreateCallParams } from '../BaseMediaCallProvider';
import type { IMediaCallProvider } from '../IMediaCallProvider';
import { InternalServerError } from '../common';

type IncomingCallEvents = {
	gotRemoteDescription: { description: RTCSessionDescriptionInit };
	callEnded: void;
	callFailed: void;
};

export class SipIncomingMediaCallProvider extends BaseMediaCallProvider implements IMediaCallProvider {
	public readonly providerName = 'sip.incoming';

	public readonly supportedRoles: CallRole[] = ['caller'];

	public readonly actorType = 'sip';

	public readonly emitter: Emitter<IncomingCallEvents>;

	protected channelId: string | null;

	protected callId: string | null;

	protected lastCallState: IMediaCall['state'];

	constructor(
		private readonly caller: MediaCallContact<MediaCallSignedActor<MediaCallActor<'sip'>>>,
		private readonly localDescription: RTCSessionDescriptionInit,
	) {
		super();
		this.channelId = null;
		this.callId = null;
		this.emitter = new Emitter();
		this.lastCallState = 'none';
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

	public async reactToCallChanges(): Promise<void> {
		logger.debug({ msg: 'SipIncomingMediaCallProvider.reactToCallChanges', callId: this.callId, lastCallState: this.lastCallState });
		this.requireCallId('reactToCallChanges');

		// If we already hung up this call, then there's nothing more to update
		if (this.lastCallState === 'hangup') {
			return;
		}

		const call = await MediaCalls.findOneById(this.callId);
		if (!call) {
			logger.error({
				msg: `Could not find the call data`,
				method: 'SipIncomingMediaCallProvider.reactToCallChanges',
				callId: this.callId,
				lastCallState: this.lastCallState,
			});
			throw new InternalServerError('invalid-call');
		}

		if (call.state === 'accepted' && this.lastCallState !== 'accepted') {
			this.requireChannelId();
			return this.processAcceptedCall();
		}

		if (call.state === 'hangup') {
			return this.processEndedCall();
		}
	}

	protected async createCallBetweenActors(params: CreateCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'SipIncomingMediaCallProvider.createCallBetweenActors', params });

		const call = await super.createCallBetweenActors(params);
		this.setCallId(call._id);
		this.lastCallState = call.state;

		try {
			await this.createContract();
		} catch (error) {
			logger.error({ msg: 'Failed to create initial channel for SIP caller', callId: call._id, error });
			await MediaCalls.hangupCallById(call._id, { endedBy: { type: 'server', id: 'server' }, reason: 'error' });
			throw error;
		}
		return call;
	}

	protected setCallId(callId: string): asserts this is SipIncomingMediaCallProviderWithCall {
		this.callId = callId;
	}

	protected requireCallId(methodName?: string): asserts this is SipIncomingMediaCallProviderWithCall {
		if (this.callId) {
			return;
		}

		logger.error({
			msg: `This method requires a callId`,
			method: `SipIncomingMediaCallProvider.${methodName || 'requireCallId'}`,
		});
		throw new InternalServerError('invalid-call');
	}

	protected requireChannelId(methodName?: string): asserts this is SipIncomingMediaCallProviderWithChannel {
		const method = methodName || 'requireChannelId';
		this.requireCallId(method);

		if (this.channelId) {
			return;
		}

		logger.error({
			msg: `This method requires a channelId`,
			method,
		});
		throw new Error('invalid-channel');
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
