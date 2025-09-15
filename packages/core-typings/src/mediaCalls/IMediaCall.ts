import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { IUser } from '../IUser';
import type { RequiredField } from '../utils';

export type MediaCallActorType = 'user' | 'sip';

export type MediaCallActor<T extends MediaCallActorType = MediaCallActorType> = {
	type: T;
	id: string;
	contractId?: string;
};

export type MediaCallSignedEntity<T extends MediaCallActor> = RequiredField<T, 'contractId'>;

export type MediaCallSignedActor<T extends MediaCallActorType = MediaCallActorType> = MediaCallSignedEntity<MediaCallActor<T>>;

export type ServerActor = {
	type: 'server';
	id: 'server';
};

export type MediaCallContactInformation = {
	displayName?: string;
	username?: string;
	sipExtension?: string;
};

export type MediaCallContact<T extends MediaCallActorType = MediaCallActorType> = MediaCallActor<T> & MediaCallContactInformation;

export type MediaCallSignedContact<T extends MediaCallActorType = MediaCallActorType> = MediaCallSignedEntity<MediaCallContact<T>>;

/* The list of call states that may actually be stored on the collection is smaller than the list of call states that may be computed by the client class */
export type MediaCallState = 'none' | 'ringing' | 'accepted' | 'active' | 'hangup';

export interface IMediaCall extends IRocketChatRecord {
	service: 'webrtc';
	kind: 'direct';

	state: MediaCallState;

	createdBy: MediaCallActor;
	createdAt: Date;

	caller: MediaCallSignedContact;
	callee: MediaCallContact;

	ended: boolean;
	endedBy?: MediaCallActor | ServerActor;
	endedAt?: Date;
	hangupReason?: string;

	expiresAt: Date;

	callerRequestedId?: string;
	parentCallId?: string;

	/** transferred* fields are filled as soon as the transfer is requested, but the old call will only end when the new one is created */
	transferredBy?: MediaCallSignedActor;
	transferredTo?: MediaCallContact;
	transferredAt?: Date;

	uids: IUser['_id'][];
}
