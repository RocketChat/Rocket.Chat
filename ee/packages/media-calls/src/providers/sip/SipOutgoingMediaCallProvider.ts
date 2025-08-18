import type { CallRole } from '@rocket.chat/media-signaling';

import type { CreateCallParams, IOutgoingMediaCallProvider } from '../IMediaCallProvider';
import { IMediaCall, IMediaCallChannel, MediaCallActor } from '@rocket.chat/core-typings';
import { logger } from '../../logger';
import { SipServerSession } from '../../agents/sip/server/Session';
import { BaseSipMediaCallProvider } from './BaseSipMediaCallProvider';
import { InsertionModel } from '@rocket.chat/model-typings';
import { MediaCallChannels, MediaCalls } from '@rocket.chat/models';
import { InternalServerError, InvalidParamsError } from '../common';

export class SipOutgoingMediaCallProvider extends BaseSipMediaCallProvider implements IOutgoingMediaCallProvider {
	public readonly providerName = 'sip.outgoing';

	public readonly supportedRoles: CallRole[] = ['callee'];

	protected remoteDescription: RTCSessionDescriptionInit | null;

	constructor(private readonly session: SipServerSession, private readonly callee: MediaCallActor) {
		super();
		this.remoteDescription = null;
	}

	public async createCall(params: CreateCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'SipOutgoingMediaCallProvider.createCall', params });

		const newCall = await this.createOutgoingCall(params);

		this.session.registerCall(newCall, this);

		return newCall;
	}

	protected async createContract(this: SipOutgoingMediaCallProviderWithCall): Promise<void> {
		logger.debug({ msg: 'SipOutgoingMediaCallProvider.createContract', callId: this.callId });

		const newChannel: InsertionModel<IMediaCallChannel> = {
			callId: this.callId,
			state: 'none',
			role: 'callee',
			acknowledged: true,
			contact: this.callee,
			contractId: this.session.sessionId,
			actorType: 'sip',
			actorId: this.callee.id,
		};

		const result = await MediaCallChannels.insertOne(newChannel);
		if (!result.insertedId) {
			throw new InternalServerError('failed-to-insert-channel');
		}

		this.channelId = result.insertedId;
	}

	protected async reflectCall(this: SipOutgoingMediaCallProviderWithCall, call: IMediaCall): Promise<void> {
		if (call.state === 'hangup') {
			// return this.processEndedCall();
			return;
		}

		if (this.lastCallState === 'none') {
			if (this.channelId && !this.remoteDescription) {
				// Check if a remoteDescription has been assigned to our contract yet
				const channel = await MediaCallChannels.findOneById(this.channelId, { projection: { remoteDescription: 1 }});
				if (channel?.remoteDescription) {
					this.remoteDescription = channel.remoteDescription;

					// If we got the remote description, we can finally make the call
					return this.startRingingById(this.callId, channel.remoteDescription);
				}
			}

			return;
		}

		if (call.state === 'accepted' && this.lastCallState !== 'accepted') {
			// this.requireChannelId();
			// return this.processAcceptedCall();
			return;
		}
	}

	protected async startRingingById(callId: string, sdp: RTCSessionDescriptionInit): Promise<void> {
		const call = await MediaCalls.findOneById(callId);
		if (!call) {
			throw new InvalidParamsError('invalid-call');
		}

		await this.session.makeOutboundCall(call, sdp);
		this.lastCallState = 'ringing';
	}
}

abstract class SipOutgoingMediaCallProviderWithCall extends SipOutgoingMediaCallProvider {
	public abstract callId: string;
}
