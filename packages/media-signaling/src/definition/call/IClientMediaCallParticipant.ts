import type { IMediaStreamWrapper } from '../media';
import type { CallActorType, CallContact, CallRole } from './common';

export interface IClientMediaCallParticipant {
	readonly local: boolean;

	readonly participantId: string;

	readonly actorType: CallActorType;

	readonly actorId: string;

	readonly role: CallRole;

	readonly muted: boolean;

	readonly held: boolean;

	readonly contact: CallContact;

	getMediaStream(tag?: string): IMediaStreamWrapper | null;
}

export interface IClientMediaCallLocalParticipant extends IClientMediaCallParticipant {
	readonly local: true;

	setMuted(muted: boolean): void;
	setHeld(onHold: boolean): void;
}

export interface IClientMediaCallRemoteParticipant extends IClientMediaCallParticipant {
	readonly local: false;
}

export type AnyClientMediaCallParticipant = IClientMediaCallLocalParticipant | IClientMediaCallRemoteParticipant;
