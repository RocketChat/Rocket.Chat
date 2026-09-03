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
 * What app refused a call, and what it said about it.
 *
 * `appName` is the app's name as of the moment it acted; an uninstalled app cannot be asked
 * for it.
 *
 * `text` always carries words a reader can read on its own.
 *
 * `i18n.ns` is always `app-<appId>` today and so derivable from `appId`. It is stored anyway
 * because this record has to still read years after the app is gone: a stored namespace
 * survives a change to that convention, a derived one does not.
 */
export type CallPreventionRecord = {
	appId: string;
	appName: string;
	text: string;
	i18n?: { key: string; ns: string; args?: Record<string, string | number> };
};

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

	/** Set only on a call an app refused */
	preventedBy?: CallPreventionRecord;

	uids: IUser['_id'][];

	/** The list of features that may be used in this call. Values are final once the call is accepted. */
	features: string[];
}
