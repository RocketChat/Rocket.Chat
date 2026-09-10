import type { IActiveMediaCall } from './IMediaCall';

/**
 * Context of `executePostMediaCallStarted` — media has been confirmed flowing by
 * at least one of the two sides of the call.
 *
 * The moment media started is `call.activatedAt`, which this event guarantees is
 * set.
 */
export interface IMediaCallStartedContext {
	call: IActiveMediaCall;
}
