/**
 * The reasons Rocket.Chat records when a call ends.
 */
export const mediaCallHangupReasonList = [
	/** A user explicitly hung up. */
	'normal',
	/** The client was told the call is over. */
	'remote',
	/** The callee declined the call. */
	'rejected',
	/** The actor was not available. */
	'unavailable',
	/** One side asked for the other to be transferred. */
	'transfer',
	/** The call rang for the maximum duration with no answer. */
	'not-answered',
	/** The server's expiration sweep ended a call that stopped progressing. */
	'expired',
	'timeout-local-track',
	'timeout-remote-sdp',
	'timeout-local-sdp',
	'timeout-activation',
	/** The call state did not progress for too long. */
	'timeout',
	'signaling-error',
	'service-error',
	'media-error',
	'input-error',
	/** An unidentified error. */
	'error',
	/** One of the call's signed users reported they do not know this call. */
	'unknown',
	/** A user asked for a hangup from a different session than the one holding the call. */
	'another-client',
	/** A SIP REFER failed while the call was transferred. Only in stored history from before PR #41964. */
	'sip-refer-failed',
] as const;

/**
 * The SIP failures carry the response code they came from, e.g. `'sip-error-486'`.
 * Rocket.Chat writes no new SIP code, but stored call history from earlier versions
 * still contains them.
 */
export type KnownMediaCallHangupReason = (typeof mediaCallHangupReasonList)[number] | `sip-error-${string}`;

/**
 * What `hangupReason` may hold. The stored field is free-form text, so a value
 * outside {@link KnownMediaCallHangupReason} is possible: never treat the known
 * list as exhaustive. Use {@link isKnownMediaCallHangupReason} to narrow before
 * an exhaustive `switch`.
 */
export type MediaCallHangupReason = KnownMediaCallHangupReason | (string & Record<never, never>);

/** Narrows a stored reason to the set this SDK version documents. */
export function isKnownMediaCallHangupReason(reason: MediaCallHangupReason | undefined): reason is KnownMediaCallHangupReason {
	if (typeof reason !== 'string') {
		return false;
	}

	return (mediaCallHangupReasonList as readonly string[]).includes(reason) || reason.startsWith('sip-error-');
}
