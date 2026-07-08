type MediaCallActorType = 'user' | 'sip';

type MediaCallContact = {
	type: MediaCallActorType;
	id: string;
	contractId?: string;
	displayName?: string;
	username?: string;
	sipExtension?: string;
};

type MediaCallSignedContact = MediaCallContact & { contractId: string };

type MediaCallState = 'none' | 'ringing' | 'accepted' | 'active' | 'hangup';

export interface IMediaCall {
	_id: string;
	_updatedAt: Date;
	service: string;
	kind: string;
	state: MediaCallState;
	createdBy: MediaCallContact;
	createdAt: Date;
	caller: MediaCallSignedContact;
	callee: MediaCallContact;
	ended: boolean;
	endedBy?: { type: MediaCallActorType | 'server'; id: string; contractId?: string };
	endedAt?: Date;
	hangupReason?: string;
	expiresAt: Date;
	acceptedAt?: Date;
	activatedAt?: Date;
	callerRequestedId?: string;
	parentCallId?: string;
	transferredBy?: MediaCallSignedContact;
	transferredTo?: MediaCallContact;
	transferredAt?: Date;
	uids: string[];
	features: string[];
	sipCallId?: string;
}
