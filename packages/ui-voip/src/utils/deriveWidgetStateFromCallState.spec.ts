import type { CallState } from '@rocket.chat/media-signaling';

import { deriveWidgetStateFromCallState } from './deriveWidgetStateFromCallState';

describe('deriveWidgetStateFromCallState', () => {
	describe('when call state indicates an ongoing call', () => {
		const ongoingStates: CallState[] = ['active', 'accepted', 'renegotiating'];

		it.each(ongoingStates)("returns 'ongoing' for callState '%s' regardless of role", (callState) => {
			expect(deriveWidgetStateFromCallState(callState, 'caller')).toBe('ongoing');
			expect(deriveWidgetStateFromCallState(callState, 'callee')).toBe('ongoing');
		});
	});

	describe("when call state is 'none' or 'ringing'", () => {
		const pendingStates: CallState[] = ['none', 'ringing'];

		it.each(pendingStates)("returns 'ringing' for callState '%s' when role is callee", (callState) => {
			expect(deriveWidgetStateFromCallState(callState, 'callee')).toBe('ringing');
		});

		it.each(pendingStates)("returns 'calling' for callState '%s' when role is caller", (callState) => {
			expect(deriveWidgetStateFromCallState(callState, 'caller')).toBe('calling');
		});
	});

	describe('when call state is not mapped to a widget state', () => {
		it("returns undefined for callState 'hangup'", () => {
			expect(deriveWidgetStateFromCallState('hangup', 'caller')).toBeUndefined();
			expect(deriveWidgetStateFromCallState('hangup', 'callee')).toBeUndefined();
		});
	});
});
