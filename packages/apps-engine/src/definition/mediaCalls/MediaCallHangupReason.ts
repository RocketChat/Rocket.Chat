/**
 * The reasons Rocket.Chat records when a call ends.
 *
 * This list is a **copy** of `callHangupReasonList` in
 * `@rocket.chat/media-signaling`. The Apps-Engine ships the app-facing SDK on its
 * own and must not depend on an internal package, so the values are duplicated
 * here. `appEvents.spec.ts` asserts that this copy still matches the original
 * exactly.
 *
 * The copy adds `'expired'`, which the server still writes through
 * `hangupByServer`.
 *
 * It also keeps `'sip-refer-failed'` and the `sip-error-<code>` family. Rocket.Chat
 * no longer writes either one: PR #41964 replaced them with `'signaling-error'`.
 * `hangupReason` is a stored field, so call history written before that change
 * still holds those values. An app that reads older history must recognise them.
 *
 * `@rocket.chat/media-signaling` also exports `isCallHangupReason`. That helper is
 * deliberately stricter: it covers only the client list, so it rejects `'expired'`
 * and every SIP code. The two helpers serve different audiences, so neither one
 * should call the other.
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
 * A reason Rocket.Chat is known to record, or was known to record before PR #41964.
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
