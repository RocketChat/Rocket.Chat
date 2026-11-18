import type { CallState } from '../../definition/index.js';

/* returns true if the value represents a state in which the underlying service has not been involved yet */
export function isPendingState(state: CallState): boolean {
	return ['none', 'ringing'].includes(state);
}

/* returns true if the value represents a state in which the underlying service is already involved in the call */
export function isBusyState(state: CallState): boolean {
	return ['accepted', 'active', 'renegotiating'].includes(state);
}
