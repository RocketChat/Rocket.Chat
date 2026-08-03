import { expect } from 'chai';

import { canRingConferenceMember, getConferenceMemberStatus } from '../../../../lib/videoConference/memberStatus';

const at = new Date('2026-08-02T10:00:00.000Z');

describe('getConferenceMemberStatus', () => {
	it('reports a member who is in the call as joined', () => {
		expect(getConferenceMemberStatus({ joined: true })).to.equal('joined');
	});

	it('reports a member who was added and has not answered as invited', () => {
		expect(getConferenceMemberStatus({ joined: false })).to.equal('invited');
	});

	it('reports a member who dismissed the call as declined', () => {
		expect(getConferenceMemberStatus({ joined: false, declined: true })).to.equal('declined');
	});

	it('reports a member who joined and left as left', () => {
		expect(getConferenceMemberStatus({ joined: true, leftAt: at })).to.equal('left');
	});

	// The entry accumulates rather than replaces, so the fields have to be read in order of what happened last.
	it('prefers having joined over an earlier decline', () => {
		expect(getConferenceMemberStatus({ joined: true, declined: true, declinedAt: at } as never)).to.equal('joined');
	});

	it('prefers having left over an earlier decline, since they did answer', () => {
		expect(getConferenceMemberStatus({ joined: true, declined: true, leftAt: at })).to.equal('left');
	});

	// Entries written before the flag existed were only ever created on join, so an absent flag reads as joined.
	it('treats an entry predating the joined flag as joined', () => {
		expect(getConferenceMemberStatus({})).to.equal('joined');
	});
});

describe('canRingConferenceMember', () => {
	it('will not ring someone already in the call', () => {
		expect(canRingConferenceMember({ joined: true })).to.be.false;
	});

	it('rings anyone who is not', () => {
		expect(canRingConferenceMember({ joined: false })).to.be.true;
		expect(canRingConferenceMember({ joined: false, declined: true })).to.be.true;
		expect(canRingConferenceMember({ joined: true, leftAt: at })).to.be.true;
	});
});
