import type { IMediaCallEndedContext } from './IMediaCallEndedContext';

/** Replaces the call snapshot of an ended-call context with a narrower one. */
type WithCall<TContext extends { call: unknown }, TCall> = Omit<TContext, 'call'> & { call: TCall };

type EndedCall = IMediaCallEndedContext['call'];

/**
 * An ended call the callee never joined. `acceptedAt` is absent, and because a
 * call only activates out of the `accepted` state, `durationMs` is `0`.
 */
export type IUnansweredMediaCallEndedContext = WithCall<IMediaCallEndedContext, Omit<EndedCall, 'acceptedAt'> & { acceptedAt?: undefined }>;

/** An ended call the callee joined. `acceptedAt` is the moment they accepted. */
export type IAnsweredMediaCallEndedContext = WithCall<IMediaCallEndedContext, Omit<EndedCall, 'acceptedAt'> & { acceptedAt: Date }>;

/** An ended call the callee actively declined. */
export type IRejectedMediaCallEndedContext = WithCall<
	IUnansweredMediaCallEndedContext,
	Omit<IUnansweredMediaCallEndedContext['call'], 'hangupReason'> & { hangupReason: 'rejected' }
>;

/**
 * The callee joined this call.
 *
 * `acceptedAt` is the discriminator, not `hangupReason`: an answered call that
 * later fails records an error reason like any other.
 */
export function isAnsweredCall(context: IMediaCallEndedContext): context is IAnsweredMediaCallEndedContext {
	return Boolean(context.call.acceptedAt);
}

/**
 * The callee saw this call and declined it. A decline is a deliberate answer, so
 * it is *not* a missed call — see {@link isMissedCall}.
 */
export function isRejectedCall(context: IMediaCallEndedContext): context is IRejectedMediaCallEndedContext {
	return !isAnsweredCall(context) && context.call.hangupReason === 'rejected';
}

/**
 * Nobody answered this call, and the callee did not decline it. Covers the ring
 * timeout, an unreachable callee, expiry, and every transport failure that ended
 * the call before it was accepted.
 *
 * Do not test `call.hangupReason === 'not-answered'` instead. That value is written
 * by the *caller's* client when its ring timeout fires. A caller that closes the tab
 * or loses the network first leaves the server's sweep to end the call as
 * `'expired'` — the same missed call, a different reason.
 *
 * ```ts
 * public async [AppMethod.EXECUTE_POST_MEDIA_CALL_ENDED](context: IMediaCallEndedContext): Promise<void> {
 *     if (isMissedCall(context)) {
 *         await this.notifyOfMissedCall(context.call.callee, context.call.caller);
 *     }
 * }
 * ```
 */
export function isMissedCall(context: IMediaCallEndedContext): context is IUnansweredMediaCallEndedContext {
	return !isAnsweredCall(context) && !isRejectedCall(context);
}
