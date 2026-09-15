import type { IVideoConferenceUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import {
	PRESENCE_HEARTBEAT_MS,
	PRESENCE_LEASE_MS,
	PRESENCE_LEASE_TICKS,
	PRESENCE_THROTTLED_HEARTBEAT_MS,
	expiredPresenceLeases,
	isPresenceSweepDue,
} from './presence';

const ts = new Date('2026-08-02T10:00:00.000Z');
const at = (offsetMs: number) => new Date(ts.getTime() + offsetMs);

const member = (overrides: Partial<IVideoConferenceUser> & Pick<IVideoConferenceUser, '_id'>): IVideoConferenceUser => ({
	username: `${overrides._id}.user`,
	name: overrides._id,
	avatarETag: null,
	ts,
	joined: true,
	joinedAt: ts,
	...overrides,
});

describe('expiredPresenceLeases', () => {
	it('keeps a member whose lease is still good', () => {
		const users = [member({ _id: 'fresh', lastSeenAt: at(PRESENCE_LEASE_MS) })];

		expect(expiredPresenceLeases(users, at(PRESENCE_LEASE_MS + 1))).to.deep.equal([]);
	});

	it('gives up on a member who stopped renewing', () => {
		const users = [member({ _id: 'gone', lastSeenAt: ts })];

		expect(expiredPresenceLeases(users, at(PRESENCE_LEASE_MS))).to.deep.equal([{ uid: 'gone', leftAt: ts }]);
	});

	// The whole reason a watermark is kept rather than just a flag. A call recovered twenty minutes after the
	// workspace went down must not add twenty minutes to everyone's call history: the last evidence is the honest
	// answer, and it happens to land at about the moment the lights went out.
	it('dates the departure from the last evidence, not from the sweep', () => {
		const lastSeenAt = at(60_000);
		const users = [member({ _id: 'gone', lastSeenAt })];

		const [expired] = expiredPresenceLeases(users, at(20 * 60_000));

		expect(expired.leftAt).to.deep.equal(lastSeenAt);
	});

	// A conference that was already running when leases arrived has members with nothing but a join to go on.
	// Reading that as the last evidence is what lets the sweep clear ghosts left behind by the old behaviour.
	it('falls back to the join, then to the membership, for entries written before leases existed', () => {
		const joinedAt = at(60_000);

		expect(expiredPresenceLeases([member({ _id: 'old', joinedAt })], at(60_000 + PRESENCE_LEASE_MS))).to.deep.equal([
			{ uid: 'old', leftAt: joinedAt },
		]);
		expect(expiredPresenceLeases([member({ _id: 'older', joinedAt: undefined })], at(PRESENCE_LEASE_MS))).to.deep.equal([
			{ uid: 'older', leftAt: ts },
		]);
	});

	// Presence is joined-and-not-left, so the two states that aren't presence have no lease to lose. Reporting
	// them would rewrite a departure the member reported themselves with a later, invented one.
	it('ignores members who never joined or have already left', () => {
		const users = [
			member({ _id: 'invited', joined: false, joinedAt: undefined }),
			member({ _id: 'left', lastSeenAt: ts, leftAt: at(1_000) }),
		];

		expect(expiredPresenceLeases(users, at(PRESENCE_LEASE_MS * 2))).to.deep.equal([]);
	});
});

describe('isPresenceSweepDue', () => {
	// The guard that makes leases survivable across a restart: from the database, "everyone left" and "we were not
	// here to be told" are the same picture, and only the clock tells them apart.
	it('holds off until a process has been up for a full lease', () => {
		expect(isPresenceSweepDue(0)).to.be.false;
		expect(isPresenceSweepDue(PRESENCE_LEASE_MS - 1)).to.be.false;
		expect(isPresenceSweepDue(PRESENCE_LEASE_MS)).to.be.true;
	});

	// The rate a window aims for has to be one a throttled window can actually keep, or it drops renewals it
	// believes it is sending.
	it('aims for a heartbeat a throttled window can keep', () => {
		expect(PRESENCE_HEARTBEAT_MS).to.be.at.most(PRESENCE_THROTTLED_HEARTBEAT_MS);
	});

	// The arithmetic cannot tell "intervals spanned" from "renewals tolerated", and the two read alike, so the
	// boundary is pinned here instead: expiry is inclusive, which makes the last interval a deadline.
	it('survives every throttled renewal going missing but the last', () => {
		const users = [member({ _id: 'hidden', lastSeenAt: ts })];

		expect(expiredPresenceLeases(users, at(PRESENCE_THROTTLED_HEARTBEAT_MS * (PRESENCE_LEASE_TICKS - 1)))).to.deep.equal([]);
		expect(expiredPresenceLeases(users, at(PRESENCE_THROTTLED_HEARTBEAT_MS * PRESENCE_LEASE_TICKS))).to.deep.equal([
			{ uid: 'hidden', leftAt: ts },
		]);
	});
});
