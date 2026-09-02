import type { IMediaCallContact, MediaCallFeature, MediaCallOrigin } from './IMediaCall';

/**
 * Context of `executePreMediaCallCreated`. The call has been routed — both
 * contacts are final and every permission check has already run — but nothing
 * has been persisted yet, which is why there is no call id.
 */
export interface IPreMediaCallCreatedContext {
	caller: IMediaCallContact;
	callee: IMediaCallContact;
	/** Who requested the call — the caller, except on transfers. */
	createdBy: IMediaCallContact;
	/**
	 * The features requested for the call. Features the workspace does not allow
	 * are filtered out after this event runs, so patching a feature in here does
	 * not bypass workspace configuration.
	 */
	features: MediaCallFeature[];
	/**
	 * Whether the call travels over the PBX, and which side opened it. It follows
	 * from the two contacts, so it is not patchable.
	 */
	origin: MediaCallOrigin;
	/** Set when this call is replacing another one through a transfer. */
	parentCallId?: string;
	/**
	 * Set when the PBX forwarded the call: the party whose line diverted it. A call
	 * screening app sees a diversion here before the call exists.
	 */
	divertedBy?: IMediaCallContact;
}

/**
 * The part of the pre-create context an app may `patch`. Contacts are not
 * patchable: they are the outcome of routing and of the permission checks that
 * ran before this event.
 */
export type MediaCallCreatePatch = Pick<IPreMediaCallCreatedContext, 'features'>;
