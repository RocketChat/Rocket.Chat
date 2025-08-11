import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { RequiredField } from '../utils';

export type MediaCallActorType = 'user' | 'sip';

export type MediaCallActor<T extends MediaCallActorType = MediaCallActorType> = {
	type: T;
	id: string;
	contractId?: string;
};

export type MediaCallSignedActor<T extends MediaCallActor = MediaCallActor> = RequiredField<T, 'contractId'>;

export type ServerActor = {
	type: 'server';
	id: 'server';
};

export type MediaCallContactInformation = {
	displayName?: string;
	username?: string;
	sipExtension?: string;

	// avatarUrl?: string;
	// host?: string;
};

export type MediaCallContact<T extends MediaCallActor = MediaCallActor> = T & MediaCallContactInformation;

export type MediaCallSignedContact = MediaCallContact<MediaCallSignedActor>;

export interface IMediaCall extends IRocketChatRecord {
	service: 'webrtc';
	kind: 'direct';

	state: 'none' | 'ringing' | 'accepted' | 'active' | 'hangup';

	createdBy: MediaCallActor;
	createdAt: Date;

	caller: MediaCallSignedContact;
	callee: MediaCallContact;

	endedBy?: MediaCallActor | ServerActor;
	endedAt?: Date;
	hangupReason?: string;

	expiresAt: Date;

	callerRequestedId?: string;
}
