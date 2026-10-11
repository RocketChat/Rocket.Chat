import { getConferenceMemberStatus } from './memberStatus';

const at = new Date('2026-08-02T10:00:00.000Z');

describe('getConferenceMemberStatus', () => {
	it('reports a member who is in the call as joined', () => {
		expect(getConferenceMemberStatus({ joined: true })).toBe('joined');
	});

	it('reports a member who was added and has not answered as invited', () => {
		expect(getConferenceMemberStatus({ joined: false })).toBe('invited');
	});

	it('reports a member who dismissed the call as declined', () => {
		expect(getConferenceMemberStatus({ joined: false, declined: true })).toBe('declined');
	});

	it('reports a member who joined and left as left', () => {
		expect(getConferenceMemberStatus({ joined: true, leftAt: at })).toBe('left');
	});

	// The entry accumulates rather than replaces, so the fields have to be read in order of what happened last.
	it('prefers having joined over an earlier decline', () => {
		expect(getConferenceMemberStatus({ joined: true, declined: true, declinedAt: at } as never)).toBe('joined');
	});

	it('prefers having left over an earlier decline, since they did answer', () => {
		expect(getConferenceMemberStatus({ joined: true, declined: true, leftAt: at })).toBe('left');
	});
});
