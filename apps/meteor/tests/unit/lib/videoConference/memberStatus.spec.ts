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
	const now = at.getTime();

	it('will not ring someone already in the call', () => {
		expect(canRingConferenceMember({ joined: true }, now)).to.be.false;
	});

	it('rings anyone who is not', () => {
		expect(canRingConferenceMember({ joined: false }, now)).to.be.true;
		expect(canRingConferenceMember({ joined: false, declined: true }, now)).to.be.true;
		expect(canRingConferenceMember({ joined: true, leftAt: at }, now)).to.be.true;
	});

	// There is nothing to ask for while their phone is already ringing.
	it('will not ring a member who is being rung right now', () => {
		expect(canRingConferenceMember({ joined: false, ringingAt: new Date(now - 3_000) }, now)).to.be.false;
	});

	// A ring is one-shot and stops on its own, with nothing to announce that it has — so the offer comes back.
	it('rings a member whose ring has since run out', () => {
		expect(canRingConferenceMember({ joined: false, ringingAt: new Date(now - 30_000) }, now)).to.be.true;
	});

	// Declining is an answer: the phone has stopped, so calling back is immediately on the table.
	it('rings a member who declined the ring that is still inside its window', () => {
		const ringingAt = new Date(now - 3_000);
		expect(canRingConferenceMember({ joined: false, ringingAt, declined: true, declinedAt: new Date(now - 1_000) }, now)).to.be.true;
	});

	// A decline recorded *before* this ring says nothing about it — they were rung again since.
	it('will not ring a member whose decline predates the current ring', () => {
		expect(
			canRingConferenceMember({ joined: false, ringingAt: new Date(now - 3_000), declined: true, declinedAt: new Date(now - 60_000) }, now),
		).to.be.false;
	});
});
