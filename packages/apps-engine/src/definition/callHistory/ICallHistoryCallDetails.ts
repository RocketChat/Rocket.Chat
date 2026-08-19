/**
 * The state a call was left in. Narrower than the state a client tracks while a call
 * is live — the history only ever reports a call that has already ended, so in
 * practice this is `'hangup'`.
 */
export type CallHistoryCallState = 'none' | 'ringing' | 'accepted' | 'active' | 'hangup';

/**
 * Whoever ended the call. `'server'` covers the endings with no person behind them —
 * expiry, transport failures and forced hangups — so never assume `id` is a user id
 * without checking `type`.
 */
export type CallHistoryEndedBy = {
	type: 'user' | 'sip' | 'server';
	id: string;
};

/**
 * The audit detail the history row does not carry, read from the call record itself.
 *
 * The history row is shaped for display: it collapses why a call ended into five
 * `CallHistoryState` buckets. This is the unabridged version, for a report that has to
 * be precise about the outcome.
 */
export interface ICallHistoryCallDetails {
	state: CallHistoryCallState;

	/**
	 * Why the call ended, unabridged — `'normal'`, `'rejected'`, `'not-answered'`,
	 * `'expired'`, a `'timeout-*'` or `'sip-error-<code>'` variant, and others.
	 *
	 * Deliberately typed as a plain string: the stored value is free-form text, and the
	 * SIP failures carry the response code they came from, so no fixed union can be
	 * exhaustive. Match on it defensively.
	 */
	hangupReason?: string;

	endedBy?: CallHistoryEndedBy;

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
	features: string[];
}
