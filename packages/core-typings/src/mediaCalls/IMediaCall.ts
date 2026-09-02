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
 * What refused a call, and what it said. Nothing ever reads the words without the app that
 * wrote them, so this is one type: the two members are told apart by `'key' in record`.
 *
 * `appName` is the app's name as of the moment it acted; an uninstalled app cannot be asked
 * for it. Either member carries the words in `text`. A record that names no key carries only
 * `text`. One that names a key carries `text` too: the app's own wording in the workspace's
 * default language, captured while the app was still installed, read as a fallback once the app
 * is gone. Either way it is capped at 200 characters.
 *
 * `ns` is always `app-<appId>` today and so derivable from the field beside it. It is stored
 * anyway because this record has to still read years after the app is gone: a stored
 * namespace survives a change to that convention, a derived one does not.
 */
export type CallPreventionRecord = { appId: string; appName: string } & (
	| { text: string }
	| { text: string; key: string; ns: string; args?: Record<string, string | number> }
);

export interface IMediaCall extends IRocketChatRecord {
	service: 'webrtc';
	kind: 'direct';

	state: MediaCallState;

	createdBy: MediaCallContact;
	createdAt: Date;

	caller: MediaCallSignedContact;
	callee: MediaCallContact;

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

	/** The party whose line was diverted at the SIP level (from the Diversion header) */
	divertedBy?: MediaCallContact;

	/**
	 * Set only on a call an app refused. The call is `ended` from the moment it is written, so it
	 * never rang and never connected.
	 *
	 * Anything that comes to count calls, bill for them or report on them has to exclude these:
	 * the collection holds call attempts that got as far as routing, not calls that happened.
	 */
	preventedBy?: CallPreventionRecord;

	uids: IUser['_id'][];

	/** The list of features that may be used in this call. Values are final once the call is accepted. */
	features: string[];
}
