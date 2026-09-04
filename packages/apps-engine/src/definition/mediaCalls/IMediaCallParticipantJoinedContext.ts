import type { IAcceptedMediaCall } from './IMediaCall';

/**
 * Context of `executePostMediaCallParticipantJoined`, emitted when the callee
 * accepts the call.
 *
 * Media calls are strictly two-party (`kind: 'direct'`), so this event fires at
 * most once per call and the participant that joined is always `call.callee` —
 * there is no server-side participant list to join or leave. The moment they
 * joined is `call.acceptedAt`, which this event guarantees is set. The departure
 * side of a call is `executePostMediaCallEnded`.
 */
export interface IMediaCallParticipantJoinedContext {
	call: IAcceptedMediaCall;
}
