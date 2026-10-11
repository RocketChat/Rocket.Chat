import type { IEndedMediaCall } from './IMediaCall';

/**
 * Context of `executePostMediaCallEnded`. Every call ends through this event,
 * including the ones no user ended — expiration, transport errors and transfers
 * report a `'server'` actor in `call.endedBy`.
 *
 * Why the call ended is `call.hangupReason`, who ended it is `call.endedBy`, and
 * when is `call.endedAt`, which this event guarantees is set. `call.endedBy` is
 * absent when the call was ended by something that isn't an identifiable actor.
 *
 * There is no separate event for a call nobody answered. Use `isMissedCall`,
 * `isRejectedCall` and `isAnsweredCall` to tell the outcomes apart.
 */
export interface IMediaCallEndedContext {
	call: IEndedMediaCall;
	/**
	 * How long media was flowing, in milliseconds. `0` for calls that never became
	 * active. It is not part of the call: the call carries the two timestamps it is
	 * computed from.
	 */
	durationMs: number;
}
