import type { IMediaCall, IMediaCallChannel, MediaCallActor, MediaCallContact, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { MediaCallChannels, MediaCalls } from '@rocket.chat/models';

import { logger } from '../../logger';
import { BaseMediaCallProvider, type CreateCallParams } from '../BaseMediaCallProvider';
import type { IMediaCallProvider } from '../IMediaCallProvider';

export class SipIncomingMediaCallProvider extends BaseMediaCallProvider implements IMediaCallProvider {
	public readonly providerName = 'sip.incoming';

	public readonly supportedRoles: CallRole[] = ['caller'];

	public readonly actorType = 'sip';

	constructor(
		private readonly caller: MediaCallContact<MediaCallSignedActor<MediaCallActor<'sip'>>>,
		private readonly localDescription: RTCSessionDescriptionInit,
	) {
		super();
		//
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

	protected async createCallBetweenActors(params: CreateCallParams): Promise<IMediaCall> {
		logger.debug({ msg: 'SipIncomingMediaCallProvider.createCallBetweenActors' });

		const call = await super.createCallBetweenActors(params);
		try {
			await this.createContract(call._id);
		} catch (error) {
			logger.error({ msg: 'Failed to create initial channel for SIP caller', callId: call._id });
			await MediaCalls.hangupCallById(call._id, { endedBy: { type: 'server', id: 'server' }, reason: 'error' });
			throw error;
		}
		return call;
	}

	private async createContract(callId: string): Promise<void> {
		logger.debug({ msg: 'SipIncomingMediaCallProvider.createContract', callId });

		const newChannel: InsertionModel<IMediaCallChannel> = {
			callId,
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
			throw new Error('failed-to-insert-channel');
		}
	}
}
