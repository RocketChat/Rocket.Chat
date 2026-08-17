import type { IMediaCall, MediaCallActor, MediaCallActorType, MediaCallContact, MediaCallSignedActor } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';

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

	public getMyCallActor(call: IMediaCall): MediaCallContact {
		return call[this.role];
	}

	public getOtherCallActor(call: IMediaCall): MediaCallContact {
		return call[this.oppositeRole];
	}

	public getSignedActor(contractId: string): MediaCallSignedActor {
		return {
			...this.actor,
			contractId,
		};
	}

	public abstract onCallAccepted(call: IMediaCall): Promise<void>;

	public abstract onCallActive(callId: string): Promise<void>;

	public abstract onCallEnded(callId: string): Promise<void>;

	public abstract onCallCreated(call: IMediaCall): Promise<void>;

	public abstract onRemoteDescriptionChanged(callId: string, negotiationId: string): Promise<void>;

	public abstract onCallTransferred(callId: string): Promise<void>;

	public abstract onDTMF(callId: string, dtmf: string, duration: number): Promise<void>;
}
