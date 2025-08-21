import type { IMediaCall, IMediaCallChannel, MediaCallActor, MediaCallActorType, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { CallContact, CallRole } from '@rocket.chat/media-signaling';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { MediaCallChannels } from '@rocket.chat/models';

import type { IMediaCallAgent } from './definition/IMediaCallAgent';

export abstract class BaseMediaCallAgent implements IMediaCallAgent {
	public readonly actorType: MediaCallActorType;

	public readonly actorId: string;

	public readonly role: CallRole;

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

	constructor(data: MediaCallActor & { role: CallRole }) {
		this.actorType = data.type;
		this.actorId = data.id;
		this.role = data.role;
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

	public async getOrCreateChannel(
		call: IMediaCall,
		contractId: string,
		params?: Pick<IMediaCallChannel, 'acknowledged' | 'localDescription'>,
	): Promise<IMediaCallChannel> {
		return this.createOrUpdateChannel(call, this.getSignedActor(contractId), this.getMyCallActor(call), params);
	}

	public abstract onCallCreated(call: IMediaCall): Promise<void>;

	public async onRemoteDescriptionChanged(callId: string, description: RTCSessionDescriptionInit): Promise<void> {
		await MediaCallChannels.setRemoteDescriptionByCallIdAndActor(callId, this.actor, description);
	}

	protected async createOrUpdateChannel(
		call: IMediaCall,
		actor: MediaCallSignedActor,
		contact: CallContact,
		params?: Pick<IMediaCallChannel, 'acknowledged' | 'localDescription'>,
	): Promise<IMediaCallChannel> {
		if (!actor.contractId) {
			throw new Error('error-invalid-contract');
		}

		const localDescription = params?.localDescription || this.localDescription || undefined;

		const newChannel: InsertionModel<IMediaCallChannel> = {
			callId: call._id,
			state: 'none',
			role: this.role,
			acknowledged: Boolean(params?.acknowledged) ?? false,
			...(localDescription && { localDescription }),
			contact,
			contractId: actor.contractId,
			actorType: actor.type,
			actorId: actor.id,
		};

		// Create this channel if it doesn't yet exist, or update ack/sdp if it does and needs it
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

	protected async autoDetectRemoteDescription(call: IMediaCall, localChannel: IMediaCallChannel): Promise<void> {
		// If our channel already has a remote description, we don't need to check anything
		if (localChannel.remoteDescription) {
			return;
		}

		// If the other actor is not signed, we don't know what channel to check
		const otherActor = this.getOtherCallActor(call);
		if (!otherActor.contractId) {
			return;
		}

		const remoteChannel = await MediaCallChannels.findOneByCallIdAndSignedActor(
			{
				...(otherActor as MediaCallSignedActor),
				callId: call._id,
			},
			{ projection: { localDescription: 1 } },
		);

		if (!remoteChannel?.localDescription) {
			return;
		}

		await this.onRemoteDescriptionChanged(call._id, remoteChannel.localDescription);
	}
}
