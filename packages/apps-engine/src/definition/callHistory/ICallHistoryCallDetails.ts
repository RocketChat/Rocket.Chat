import type { IMediaCallActor, MediaCallFeature, MediaCallState } from '../mediaCalls/IMediaCall';
import type { MediaCallHangupReason } from '../mediaCalls/MediaCallHangupReason';

/**
 * What an app said when it refused a call, kept as the call record's own account of the
 * block. The call's `state` is `'hangup'` and the history row's state is `'prevented'`.
 *
 * `appName` is the name the app had at the moment it acted: an app that was uninstalled
 * since cannot be asked for it, so the stored copy is the only one left.
 *
 * `text` always carries words a reader can read on its own, whether or not `i18n` is set.
 * Prefer `i18n` when you can resolve it, and fall back to `text`.
 */
export interface ICallHistoryPrevention {
	/** The app that refused the call. It may no longer be installed. */
	appId: string;

	appName: string;

	/** The reason in words, already resolved to the workspace language. */
	text: string;

	/** Set when the app named a translation key instead of writing the words itself. */
	i18n?: {
		key: string;

		/** The namespace the key lives in, always `app-<appId>` for the apps shipping today. */
		ns: string;

		args?: Record<string, string | number>;
	};
}

/**
 * The audit detail the history row does not carry, read from the call record itself.
 *
 * The history row is shaped for display: it collapses why a call ended into the
 * `CallHistoryState` buckets. This is the unabridged version, for a report that has
 * to be precise about the outcome. It speaks the same vocabulary as the media call events,
 * so a value read here compares directly against one an event handler saw.
 */
export interface ICallHistoryCallDetails {
	state: MediaCallState;

	/**
	 * Why the call ended, unabridged. The stored field is free-form text, so a value outside
	 * the documented list is possible — use `isKnownMediaCallHangupReason` to narrow before
	 * an exhaustive `switch`.
	 */
	hangupReason?: MediaCallHangupReason;

	/**
	 * Whoever ended the call. `'server'` covers the endings with no person behind them —
	 * expiry, transport failures and forced hangups — so never assume `id` is a user id
	 * without checking `type`.
	 */
	endedBy?: IMediaCallActor;

	/** When the callee accepted. Absent for a call nobody answered. */
	acceptedAt?: Date;

	/** When either side first reported media flowing. Absent for a call that never connected. */
	activatedAt?: Date;

	endedAt?: Date;

	/** When a transfer was requested. Set before the old call ends. */
	transferredAt?: Date;

	/** The call this one replaced, when it exists because of a transfer. */
	parentCallId?: string;

	/** The capabilities this call was allowed to use, e.g. `'audio'`, `'video'`. */
	features: MediaCallFeature[];

	/**
	 * Set only on a call an app refused, which is also the only case where the history row's
	 * state is `'prevented'`. Absent on every call that was allowed to ring.
	 */
	preventedBy?: ICallHistoryPrevention;
}
