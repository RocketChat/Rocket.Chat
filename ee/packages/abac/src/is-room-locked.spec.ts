import type { IAbacAttributeDefinition, IRoom, LockableRoom } from '@rocket.chat/core-typings';
import { isRoomLocked } from '@rocket.chat/core-typings';

const attr = (key: string, values: string[] = ['x']): IAbacAttributeDefinition => ({ key, values });

const room = (overrides: Partial<LockableRoom> = {}): LockableRoom =>
	({
		t: 'p',
		abacAttributes: [],
		...overrides,
	}) as LockableRoom;

const ENFORCED = { enforcementOn: true, requiredAttributeKeys: [] };

describe('isRoomLocked', () => {
	describe('excluded room types — must fall through every guard (ABAC-P4 §7.1, traps 10)', () => {
		// These are the tests that catch an over-broad guard. An attribute-less room of each of
		// these types would otherwise satisfy every other condition.
		it('returns false for a 1-on-1 DM', () => {
			expect(isRoomLocked(room({ t: 'd' }), ENFORCED)).toBe(false);
		});

		it('returns false for a Group DM', () => {
			// Group DMs are also `t: 'd'`, distinguished only by uids length (D1).
			expect(isRoomLocked({ ...room({ t: 'd' }), uids: ['a', 'b', 'c'] } as LockableRoom, ENFORCED)).toBe(false);
		});

		it('returns false for an Omnichannel/Livechat room', () => {
			expect(isRoomLocked(room({ t: 'l' }), ENFORCED)).toBe(false);
		});

		it('returns false for a federated private channel (D8)', () => {
			expect(isRoomLocked(room({ t: 'p', federated: true }), ENFORCED)).toBe(false);
		});

		it('returns false for a federated public channel', () => {
			expect(isRoomLocked(room({ t: 'c', federated: true }), ENFORCED)).toBe(false);
		});

		it('does not treat federated: false or an absent flag as an exclusion', () => {
			expect(isRoomLocked(room({ t: 'p', federated: false }), ENFORCED)).toBe(true);
			expect(isRoomLocked(room({ t: 'p' }), ENFORCED)).toBe(true);
		});
	});

	describe('enforcement off', () => {
		it('returns false regardless of room state', () => {
			const ctx = { enforcementOn: false, requiredAttributeKeys: ['clearance'] };
			expect(isRoomLocked(room({ t: 'c' }), ctx)).toBe(false);
			expect(isRoomLocked(room({ t: 'p', abacAttributes: [] }), ctx)).toBe(false);
			expect(isRoomLocked(room({ t: 'p', abacAttributes: [attr('mission')] }), ctx)).toBe(false);
		});
	});

	describe('rooms with no attributes', () => {
		it('locks a private channel', () => {
			expect(isRoomLocked(room({ t: 'p', abacAttributes: [] }), ENFORCED)).toBe(true);
		});

		it('locks a public channel — the case isABACManagedRoom cannot express', () => {
			// `isABACManagedRoom` requires t === 'p', so a pre-enforcement public channel is never
			// "managed" yet must still be locked.
			expect(isRoomLocked(room({ t: 'c', abacAttributes: [] }), ENFORCED)).toBe(true);
		});

		it('locks when abacAttributes is undefined', () => {
			expect(isRoomLocked({ t: 'p' } as LockableRoom, ENFORCED)).toBe(true);
		});

		it('locks when abacAttributes is not an array', () => {
			expect(isRoomLocked({ t: 'p', abacAttributes: undefined } as LockableRoom, ENFORCED)).toBe(true);
		});
	});

	describe('in-scope room shapes (D4, D7)', () => {
		it('locks a team main room', () => {
			expect(isRoomLocked(room({ t: 'p', teamMain: true }), ENFORCED)).toBe(true);
		});

		it('locks a discussion', () => {
			expect(isRoomLocked(room({ t: 'p', prid: 'parent-room-id' }), ENFORCED)).toBe(true);
		});

		it('does not lock a compliant discussion', () => {
			const ctx = { enforcementOn: true, requiredAttributeKeys: ['clearance'] };
			expect(isRoomLocked(room({ t: 'p', prid: 'parent', abacAttributes: [attr('clearance')] }), ctx)).toBe(false);
		});
	});

	describe('required attribute set (D3)', () => {
		it('does not lock a room carrying attributes when nothing is required', () => {
			expect(isRoomLocked(room({ abacAttributes: [attr('mission')] }), ENFORCED)).toBe(false);
		});

		it('locks a room missing a required key', () => {
			const ctx = { enforcementOn: true, requiredAttributeKeys: ['clearance'] };
			expect(isRoomLocked(room({ abacAttributes: [attr('mission')] }), ctx)).toBe(true);
		});

		it('does not lock a room carrying every required key', () => {
			const ctx = { enforcementOn: true, requiredAttributeKeys: ['clearance', 'mission'] };
			expect(isRoomLocked(room({ abacAttributes: [attr('mission'), attr('clearance')] }), ctx)).toBe(false);
		});

		it('locks when only some required keys are present', () => {
			const ctx = { enforcementOn: true, requiredAttributeKeys: ['clearance', 'mission'] };
			expect(isRoomLocked(room({ abacAttributes: [attr('mission')] }), ctx)).toBe(true);
		});

		it('ignores blank entries in the required set', () => {
			const ctx = { enforcementOn: true, requiredAttributeKeys: ['', '   '] };
			expect(isRoomLocked(room({ abacAttributes: [attr('mission')] }), ctx)).toBe(false);
		});

		it('trims required keys before comparing', () => {
			const ctx = { enforcementOn: true, requiredAttributeKeys: ['  clearance  '] };
			expect(isRoomLocked(room({ abacAttributes: [attr('clearance')] }), ctx)).toBe(false);
		});

		it('compares keys case-sensitively, matching validateAndNormalizeAttributes', () => {
			const ctx = { enforcementOn: true, requiredAttributeKeys: ['Clearance'] };
			expect(isRoomLocked(room({ abacAttributes: [attr('clearance')] }), ctx)).toBe(true);
		});

		it('does not accept an attribute key carrying no values as satisfying a requirement', () => {
			const ctx = { enforcementOn: true, requiredAttributeKeys: ['clearance'] };
			expect(isRoomLocked(room({ abacAttributes: [attr('clearance', [])] }), ctx)).toBe(true);
		});

		it('still locks an attribute-less room even when the required set is empty', () => {
			expect(isRoomLocked(room({ abacAttributes: [] }), ENFORCED)).toBe(true);
		});
	});

	describe('exclusions win over non-compliance', () => {
		it('does not lock an excluded type that is also missing required attributes', () => {
			const ctx = { enforcementOn: true, requiredAttributeKeys: ['clearance'] };
			expect(isRoomLocked(room({ t: 'd', abacAttributes: [] }), ctx)).toBe(false);
			expect(isRoomLocked(room({ t: 'l', abacAttributes: [] }), ctx)).toBe(false);
			expect(isRoomLocked(room({ t: 'p', federated: true, abacAttributes: [] }), ctx)).toBe(false);
		});
	});

	it('accepts a real IRoom without widening the projection', () => {
		// Type-level guard: the predicate must accept a full IRoom, not just the Pick.
		const full = { _id: 'r', t: 'p', abacAttributes: [] } as unknown as IRoom;
		expect(isRoomLocked(full, ENFORCED)).toBe(true);
	});
});
