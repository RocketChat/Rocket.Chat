import { type Cancel as SipCancel, type Invitation, type SessionState } from 'sip.js';

import { getMainInviteRejectionReason } from './getMainInviteRejectionReason';

const mockInvitation = (state: SessionState[keyof SessionState]): Invitation =>
	({
		state,
	}) as any;

const mockSipCancel = (reasons: string[]): SipCancel =>
	({
		request: {
			headers: {
				Reason: reasons.map((raw) => ({ raw })),
			},
		},
	}) as any;

describe('getMainInviteRejectionReason', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should return undefined for natural endings', () => {
		const result = getMainInviteRejectionReason(mockInvitation('Terminated'), mockSipCancel(['SIP ;cause=487 ;text="ORIGINATOR_CANCEL"']));
		expect(result).toBeUndefined();
	});

	it('should return priorityErrorEndings if present', () => {
		const result = getMainInviteRejectionReason(
			mockInvitation('Terminated'),
			mockSipCancel(['SIP ;cause=488 ;text="USER_NOT_REGISTERED"']),
		);
		expect(result).toBe('USER_NOT_REGISTERED');
	});

	it('should return the first parsed reason if call was canceled at the initial state', () => {
		const result = getMainInviteRejectionReason(
			mockInvitation('Initial'),
			mockSipCancel(['text="UNEXPECTED_REASON"', 'text="ANOTHER_REASON"']),
		);
		expect(result).toBe('UNEXPECTED_REASON');
	});

	it('should log a warning if call was canceled for unexpected reason', () => {
		console.warn = jest.fn();
		const result = getMainInviteRejectionReason(
			mockInvitation('Terminated'),
			mockSipCancel(['text="UNEXPECTED_REASON"', 'text="ANOTHER_REASON"']),
		);
		expect(console.warn).toHaveBeenCalledWith('The call was canceled for an unexpected reason', ['UNEXPECTED_REASON', 'ANOTHER_REASON']);
		expect(result).toBeUndefined();
	});

	it('should handle empty parsed reasons array gracefully', () => {
		const result = getMainInviteRejectionReason(mockInvitation('Terminated'), mockSipCancel([]));
		expect(result).toBeUndefined();
	});
});
