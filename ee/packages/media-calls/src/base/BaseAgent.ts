import type {
	IMediaCall,
	IMediaCallChannel,
	MediaCallActor,
	MediaCallActorType,
	MediaCallContact,
	MediaCallSignedActor,
} from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { MediaCallChannels } from '@rocket.chat/models';

import type { IMediaCallAgent } from '../definition/IMediaCallAgent';

export abstract class BaseMediaCallAgent implements IMediaCallAgent {
	public readonly actorType: MediaCallActorType;

	public readonly actorId: string;

	public oppositeAgent: IMediaCallAgent | null;

	public get actor(): MediaCallActor {
		return {
			type: this.actorType,
			id: this.actorId,
		};
	}

	public get oppositeRole(): CallRole {
		return ({ callee: 'caller', caller: 'callee' } as const)[this.role];
	}

	protected localDescription: RTCSessionDescriptionInit | null;

	constructor(
		protected readonly contact: MediaCallContact,
		public readonly role: CallRole,
	) {
		this.actorType = contact.type;
		this.actorId = contact.id;
		this.localDescription = null;
		this.oppositeAgent = null;
	}

	public isRepresentingActor(actor: MediaCallActor): boolean {
		return actor.type === this.actorType && actor.id === this.actorId;
	}

	public getMyCallActor(call: IMediaCall): MediaCallActor {
		return call[this.role];
	}

	public getOtherCallActor(call: IMediaCall): MediaCallActor {
		return call[this.oppositeRole];
	}

	public getSignedActor(contractId: string): MediaCallSignedActor {
		return {
			...this.actor,
			contractId,
		};
	}

	public abstract onCallAccepted(callId: string, signedContractId: string): Promise<void>;

	public abstract onCallActive(callId: string): Promise<void>;

	public abstract onCallEnded(callId: string): Promise<void>;

	public async getOrCreateChannel(call: IMediaCall, contractId: string): Promise<IMediaCallChannel> {
		return this.createOrUpdateChannel(call, contractId);
	}

	public abstract onCallCreated(call: IMediaCall): Promise<void>;

	public abstract onRemoteDescriptionChanged(callId: string, description: RTCSessionDescriptionInit): Promise<void>;

	protected async createOrUpdateChannel(call: IMediaCall, contractId: string): Promise<IMediaCallChannel> {
		if (!contractId) {
			throw new Error('error-invalid-contract');
		}

		const newChannel: InsertionModel<IMediaCallChannel> = {
			callId: call._id,
			state: 'none',
			role: this.role,
			contractId,
			actorType: this.actorType,
			actorId: this.actorId,
		};

		// Create this channel if it doesn't yet exist
		const insertedChannel = await MediaCallChannels.createOrUpdateChannel(newChannel);
		if (!insertedChannel) {
			throw new Error('failed-to-insert-channel');
		}

		// This shouldn't be possible unless something tried to switch the roles of the call's actors
		if (insertedChannel.role !== this.role) {
			throw new Error('invalid-channel-data');
		}

		return insertedChannel;
	}
}
