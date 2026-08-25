import { VIDEO_CONF_RINGING_LIMIT, hasJoinedVideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { shouldRingVideoConference } from '../../../../lib/videoConference/constants';
import {
	canRingConferenceMember,
	getConferenceMemberStatus,
	isUnaskedConferenceMember,
} from '../../../../lib/videoConference/memberStatus';

const at = new Date('2026-08-02T10:00:00.000Z');

// `users[]` entries were only ever written on join before membership existed, so anything without the flag is
// historical data describing someone who did join. Reading those as "not joined" would make every past
// conference look empty. Every predicate below inherits that rule, which is why it is stated once, here.
describe('hasJoinedVideoConference', () => {
	it('reads an explicit flag either way', () => {
		expect(hasJoinedVideoConference({ joined: true })).to.be.true;
		expect(hasJoinedVideoConference({ joined: false })).to.be.false;
	});

	it('treats an entry predating the flag as joined', () => {
		expect(hasJoinedVideoConference({})).to.be.true;
		expect(hasJoinedVideoConference({ joined: undefined })).to.be.true;
	});
});

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

describe('isUnaskedConferenceMember', () => {
	it('is true for someone nobody has asked yet', () => {
		expect(isUnaskedConferenceMember({ joined: false })).to.be.true;
	});

	// All three mean they have been asked: their phone rang, they answered, or they turned it down.
	it('is false once they have been rung, joined, or declined', () => {
		expect(isUnaskedConferenceMember({ joined: false, ringingAt: at })).to.be.false;
		expect(isUnaskedConferenceMember({ joined: true })).to.be.false;
		expect(isUnaskedConferenceMember({ joined: false, declined: true })).to.be.false;
	});
});

describe('shouldRingVideoConference', () => {
	// Ringing a large room would mean a broadcast per subscriber, so past a point a call rings nobody at all.
	it('rings a list up to the limit, and none beyond it', () => {
		expect(shouldRingVideoConference(1)).to.be.true;
		expect(shouldRingVideoConference(VIDEO_CONF_RINGING_LIMIT)).to.be.true;
		expect(shouldRingVideoConference(VIDEO_CONF_RINGING_LIMIT + 1)).to.be.false;
	});

	// Nobody to ring is not the same as a list small enough to ring — it saves a pointless broadcast when a
	// conference starts in an empty room, or when every user in an add was already a member.
	it('rings nobody for an empty list', () => {
		expect(shouldRingVideoConference(0)).to.be.false;
	});
});
