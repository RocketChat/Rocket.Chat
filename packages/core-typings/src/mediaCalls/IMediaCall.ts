import type { IRocketChatRecord } from '../IRocketChatRecord';
import type { IUser } from '../IUser';
import type { RequiredField } from '../utils';

export type MediaCallActorType = 'user' | 'sip';

export type MediaCallActor<T extends MediaCallActorType = MediaCallActorType> = {
	type: T;
	id: string;
	contractId?: string;
};

type MediaCallSignedEntity<T extends MediaCallActor> = RequiredField<T, 'contractId'>;

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
type MediaCallState = 'none' | 'ringing' | 'accepted' | 'active' | 'hangup';

/**
 * Per-participant state in a group call. Each user who joins the call has one
 * of these. For 'direct' calls the array is implicit (caller + callee fields).
 */
export type MediaCallGroupParticipant = {
	type: MediaCallActorType;
	id: string;
	contractId?: string;
	displayName?: string;
	username?: string;
	joinedAt?: Date;
	leftAt?: Date;
};

export interface IMediaCall extends IRocketChatRecord {
	service: 'webrtc' | 'livekit';
	/**
	 * 'direct' — classic 1:1 call with caller + callee fields populated.
	 * 'group' — multi-party call in a channel/group/team. `rid` is required,
	 * `participants` tracks who joined, `caller`/`callee` are unused.
	 */
	kind: 'direct' | 'group';

	state: MediaCallState;

	createdBy: MediaCallContact;
	createdAt: Date;

	/**
	 * Room this call belongs to. Required for group calls (the room is the
	 * coordination point for joining); optional for direct calls (which can
	 * still be tied to a DM rid for system messages).
	 */
	rid?: string;

	/**
	 * For 'direct' calls: caller and callee are the two parties.
	 * For 'group' calls: both populated with the creator as a placeholder;
	 * the real participant list lives in `participants` below. Group code
	 * MUST read `participants`, not these fields.
	 */
	caller: MediaCallSignedContact;
	callee: MediaCallContact;

	/**
	 * For 'group' calls: the list of users who have joined (or are joining).
	 * Each participant joins independently; the call is "active" while at
	 * least one participant remains. Undefined for 'direct' calls.
	 */
	participants?: MediaCallGroupParticipant[];

	ended: boolean;
	endedBy?: MediaCallActor | ServerActor;
	endedAt?: Date;
	hangupReason?: string;

	expiresAt: Date;

	/** The timestamp of the moment the callee accepted the call */
	acceptedAt?: Date;
	/** The timestamp of the moment either side reported the call as active for the first time */
	activatedAt?: Date;

	callerRequestedId?: string;
	parentCallId?: string;

	/** transferred* fields are filled as soon as the transfer is requested, but the old call will only end when the new one is created */
	transferredBy?: MediaCallSignedContact;
	transferredTo?: MediaCallContact;
	transferredAt?: Date;

	uids: IUser['_id'][];

	/** The list of features that may be used in this call. Values are final once the call is accepted. */
	features: string[];

	/**
	 * Recording metadata. Present when egress has been started for this call;
	 * persists across server restarts so the recording state can be reconciled
	 * without the in-memory tracker. Populated by the recording lib in EE.
	 */
	recording?: {
		egressId: string;
		startedAt: Date;
		endedAt?: Date;
		fileUrl?: string;
		storage: 'local' | 's3' | 'filestore' | 'both';
	};
}
