import type { IDirectVideoConference, IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';
import { isInVideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { buildDirectCall, buildGroupCall, buildMember, cloneFixture, createService, resetAll, ringedUserIds } from './testHarness';

/**
 * Who gets rung, and when.
 *
 * One suite for the three ways it happens — asking again from the members panel, adding people to a call, and a
 * direct call's callee being rung when its caller finally walks in — because they all answer the same question and
 * all answer it through the same broadcast. They were three files that each loaded the whole service and each
 * rebuilt the same broadcast filter to read the answer out of.
 */

// The single canonical record; `findOneById` hands out a clone of it, whatever projection is asked for.
let fixture: VideoConference;

const VideoConferenceModelMock = {
	findOneById: sinon.stub().callsFake(async () => cloneFixture(fixture)),
	setUsersRingingById: sinon.stub().callsFake(async (_callId: string, uids: string[], ringingAt: Date) => {
		fixture.users.forEach((user) => {
			if (uids.includes(user._id)) {
				(user as IVideoConferenceUser).ringingAt = ringingAt;
			}
		});
	}),
	// Mirrors the model: an entry is pushed as *not* present, whatever the caller passed. Getting this wrong
	// would leave fixture members with no `joined` flag at all, which every reader treats as joined.
	addMemberById: sinon.stub().callsFake(async (_callId: string, member: IVideoConferenceUser) => {
		fixture.users.push({ ...member, joined: false });
	}),
	setUserJoinedById: sinon.stub().resolves(),
	setStatusById: sinon.stub().resolves(),
	find: sinon.stub().returns({ toArray: async () => [] }),
};

// `notifyUsersAddedToConference` reads the adder and the rung members straight off `Users` and broadcasts a
// desktop notification for each — it must not throw for that to happen, so both calls need to resolve
// something shaped like a real user.
const UsersMock = {
	findOneById: sinon.stub().resolves({ _id: 'caller', username: 'caller.user', name: 'Caller User' }),
	find: sinon.stub().returns({ toArray: sinon.stub().resolves([]) }),
};

const broadcastStub = sinon.stub().resolves();

// Deliberately NOT overriding '../../../lib/videoConference/constants' — the ringing-limit guard
// (`shouldRingVideoConference`, capped at `VIDEO_CONF_RINGING_LIMIT`) is what two of the tests below exercise,
// so it has to be the real implementation.
const VideoConfService = createService({
	broadcast: broadcastStub,
	models: { VideoConference: VideoConferenceModelMock, Users: UsersMock },
});

/**
 * `notifyUsersAddedToConference` broadcasts one `notify.desktop` per added member, via
 * `api.broadcast('notify.desktop', memberId, notification)` — a 3-arg call, unlike the 2-arg ring broadcast.
 * `audioNotificationValue`/room identity live under the notification's own nested `payload` property.
 */
const desktopNotifications = (): { memberId: string; payload: Record<string, unknown> }[] =>
	broadcastStub.args
		.filter(([channel]) => channel === 'notify.desktop')
		.map(([, memberId, notification]) => ({
			memberId: memberId as string,
			payload: (notification as { payload: Record<string, unknown> }).payload,
		}));

const buildUser = (id: string) => ({ _id: id, username: `${id}.user`, name: id, avatarETag: null });

let service: any;

beforeEach(() => {
	service = new VideoConfService();
	resetAll(
		VideoConferenceModelMock.findOneById,
		VideoConferenceModelMock.setUsersRingingById,
		VideoConferenceModelMock.setUserJoinedById,
		VideoConferenceModelMock.addMemberById,
		UsersMock.findOneById,
		UsersMock.find,
		broadcastStub,
	);
	VideoConferenceModelMock.findOneById.callsFake(async () => cloneFixture(fixture));
	VideoConferenceModelMock.addMemberById.callsFake(async (_callId: string, member: IVideoConferenceUser) => {
		fixture.users.push({ ...member, joined: false });
	});
	UsersMock.findOneById.resolves({ _id: 'caller', username: 'caller.user', name: 'Caller User' });
	UsersMock.find.returns({ toArray: sinon.stub().resolves([]) });
	broadcastStub.resolves();
});

describe('VideoConfService.ringMembers', () => {
	// The base case: a member added to the call but who never answered has no active presence, so a second
	// ring is the only way to reach them.
	it('rings members who were never in the call, and nobody else', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'caller' }),
			buildMember({ _id: 'neverJoined1', joined: false, joinedAt: undefined }),
			buildMember({ _id: 'neverJoined2', joined: false, joinedAt: undefined }),
		]);

		const result = await service.ringMembers('caller', 'call1');

		expect(result.sort()).to.deep.equal(['neverJoined1', 'neverJoined2']);
		expect(ringedUserIds(broadcastStub).sort()).to.deep.equal(['neverJoined1', 'neverJoined2']);
	});

	// "Call them back" is exactly this shape: they were on the call and aren't anymore. `isInVideoConference`
	// says `joined: true` with a `leftAt` is not currently present, so they must be rung the same as anyone
	// who never picked up.
	it('rings a member who joined the call and then left it', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'caller' }),
			buildMember({ _id: 'wentQuiet', joined: true, leftAt: new Date('2026-01-01T00:15:00.000Z') }),
		]);

		const result = await service.ringMembers('caller', 'call1');

		expect(result).to.deep.equal(['wentQuiet']);
		expect(ringedUserIds(broadcastStub)).to.deep.equal(['wentQuiet']);
	});

	// Someone already on the call has no reason to be interrupted by a ring meant for people who aren't there.
	it('does not ring a member who is currently in the call', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'caller' }),
			buildMember({ _id: 'stillHere', joined: true }),
			buildMember({ _id: 'absent', joined: false, joinedAt: undefined }),
		]);

		const result = await service.ringMembers('caller', 'call1');

		expect(result).to.deep.equal(['absent']);
		expect(ringedUserIds(broadcastStub)).to.not.include('stillHere');
	});

	// The caller is the one asking for the retry, not a target of it — this has to hold even for a caller
	// entry that would otherwise read as absent (e.g. written with `joined: false`), since nothing else in
	// `ringMembers` special-cases the caller's own membership shape.
	it('never rings the caller themselves, even if their own entry looks absent', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'caller', joined: false, joinedAt: undefined }),
			buildMember({ _id: 'absent', joined: false, joinedAt: undefined }),
		]);

		const result = await service.ringMembers('caller', 'call1');

		expect(result).to.not.include('caller');
		expect(ringedUserIds(broadcastStub)).to.not.include('caller');
	});

	// Nobody absent means nothing to do — this is also what a call with a full house looks like after
	// everyone's already answered.
	it('returns an empty array when nobody is absent', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' }), buildMember({ _id: 'other', joined: true })]);

		const result = await service.ringMembers('caller', 'call1');

		expect(result).to.deep.equal([]);
		expect(ringedUserIds(broadcastStub)).to.deep.equal([]);
	});

	// A conference that already ended is not something you can still ring people into — `ringMembers` must
	// bail out before even looking at who's absent.
	it('returns an empty array and rings nobody for a conference that has already ended', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' }), buildMember({ _id: 'absent', joined: false, joinedAt: undefined })], {
			endedAt: new Date('2026-01-01T01:00:00.000Z'),
		});

		const result = await service.ringMembers('caller', 'call1');

		expect(result).to.deep.equal([]);
		expect(ringedUserIds(broadcastStub)).to.deep.equal([]);
	});

	// The cap itself is pinned on `shouldRingVideoConference` in `tests/unit/lib/videoConference`; what matters
	// here is that this path is wired to it, and that tripping it suppresses the ring entirely rather than
	// ringing the first ten.
	it('rings nobody when the number of absent members exceeds the ringing limit', async () => {
		const absentMembers: IVideoConferenceUser[] = Array.from({ length: 11 }, (_, index) =>
			buildMember({ _id: `absent${index}`, joined: false, joinedAt: undefined }),
		);
		fixture = buildGroupCall([buildMember({ _id: 'caller' }), ...absentMembers]);

		const result = await service.ringMembers('caller', 'call1');

		expect(result).to.deep.equal([]);
		expect(ringedUserIds(broadcastStub)).to.deep.equal([]);
	});

	// The members panel rings one person at a time, so the caller says who — everyone else absent is left alone.
	it('rings only the members asked for', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'caller' }),
			buildMember({ _id: 'wanted', joined: false, joinedAt: undefined }),
			buildMember({ _id: 'other', joined: false, joinedAt: undefined }),
		]);

		const result = await service.ringMembers('caller', 'call1', ['wanted']);

		expect(result).to.deep.equal(['wanted']);
		expect(ringedUserIds(broadcastStub)).to.deep.equal(['wanted']);
	});

	// Being asked for doesn't override being present: ringing someone who is already on the call is noise.
	it('will not ring a requested member who is in the call', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' }), buildMember({ _id: 'present' })]);

		const result = await service.ringMembers('caller', 'call1', ['present']);

		expect(result).to.deep.equal([]);
		expect(ringedUserIds(broadcastStub)).to.deep.equal([]);
	});

	it('rings everyone absent when no member is named', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'caller' }),
			buildMember({ _id: 'one', joined: false, joinedAt: undefined }),
			buildMember({ _id: 'two', joined: false, joinedAt: undefined }),
		]);

		const result = await service.ringMembers('caller', 'call1');

		expect(result.sort()).to.deep.equal(['one', 'two']);
	});
});

describe('VideoConfService.addMembers', () => {
	// Added, not arrived: adding somebody to a call is not answering it for them, so nothing here may mark them
	// as being in it.
	it('registers each named user as a member without marking them present, and returns the ids added', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' })]);
		const newUsers = [buildUser('newUser1'), buildUser('newUser2')];
		UsersMock.find.returns({ toArray: sinon.stub().resolves(newUsers) });

		const result = await service.addMembers('caller', 'call1', ['newUser1.user', 'newUser2.user']);

		expect(result.sort()).to.deep.equal(['newUser1', 'newUser2']);
		expect(VideoConferenceModelMock.addMemberById.callCount).to.equal(2);
		VideoConferenceModelMock.addMemberById.args.forEach(([callId]) => expect(callId).to.equal('call1'));
		expect(VideoConferenceModelMock.addMemberById.args.map(([, member]) => member._id).sort()).to.deep.equal(['newUser1', 'newUser2']);

		const added = fixture.users.filter(({ _id }) => ['newUser1', 'newUser2'].includes(_id));
		expect(added).to.have.length(2);
		added.forEach((member) => expect(isInVideoConference(member)).to.be.false);
	});

	// Overwriting an existing entry would wipe out whatever `joinedAt`/`declined` state the member already
	// has — this is the guard that stops an add from clobbering a member who is already present.
	it('skips a user who already has a users[] entry, leaving their existing state untouched', async () => {
		const existingJoinedAt = new Date('2026-01-01T00:10:00.000Z');
		fixture = buildGroupCall([
			buildMember({ _id: 'caller' }),
			buildMember({ _id: 'already', joined: true, joinedAt: existingJoinedAt, declined: true }),
		]);
		UsersMock.find.returns({ toArray: sinon.stub().resolves([buildUser('already')]) });

		const result = await service.addMembers('caller', 'call1', ['already.user']);

		expect(result).to.deep.equal([]);
		expect(VideoConferenceModelMock.addMemberById.called).to.be.false;

		const existing = fixture.users.filter((user) => user._id === 'already');
		expect(existing).to.have.length(1);
		expect(existing[0].joinedAt).to.equal(existingJoinedAt);
		expect(existing[0].declined).to.be.true;
	});

	it('rings everyone actually added', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' })]);
		const newUsers = [buildUser('newUser1'), buildUser('newUser2')];
		UsersMock.find.returns({ toArray: sinon.stub().resolves(newUsers) });

		const result = await service.addMembers('caller', 'call1', ['newUser1.user', 'newUser2.user']);

		expect(result.sort()).to.deep.equal(['newUser1', 'newUser2']);
		expect(ringedUserIds(broadcastStub).sort()).to.deep.equal(['newUser1', 'newUser2']);
	});

	// Nobody was actually added (every requested user was already a member) — there is nobody new to ring.
	it('rings nobody when nobody was added', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' }), buildMember({ _id: 'already' })]);
		UsersMock.find.returns({ toArray: sinon.stub().resolves([buildUser('already')]) });

		const result = await service.addMembers('caller', 'call1', ['already.user']);

		expect(result).to.deep.equal([]);
		expect(ringedUserIds(broadcastStub)).to.deep.equal([]);
	});

	// A call must not announce itself with the new-message sound (`audioNotificationValue: 'none'`), and its
	// click must not try to open a room the member may not be able to see (no `payload.name`).
	it('sends a silent desktop notification with no room name for each added member', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'caller' })]);
		const newUsers = [buildUser('newUser1')];
		UsersMock.find.returns({ toArray: sinon.stub().resolves(newUsers) });
		UsersMock.findOneById.resolves({ _id: 'caller', username: 'caller.user', name: 'Caller User' });

		await service.addMembers('caller', 'call1', ['newUser1.user']);

		const notifications = desktopNotifications();
		expect(notifications).to.have.length(1);
		expect(notifications[0].memberId).to.equal('newUser1');
		expect(notifications[0].payload).to.include({ audioNotificationValue: 'none' });
		expect(notifications[0].payload).to.not.have.property('name');
	});
});

// Creating the call is not asking anyone to answer it: the caller lands on the preflight first, and being rung
// into a call whose caller is still choosing a camera means answering to an empty room.
describe('VideoConfService: ringing a direct call when its caller arrives', () => {
	const directCall = (callee: Partial<IVideoConferenceUser> = {}): IDirectVideoConference =>
		buildDirectCall([
			buildMember({ _id: 'creator', joined: false, joinedAt: undefined }),
			buildMember({ _id: 'callee', joined: false, joinedAt: undefined, ...callee }),
		]);

	beforeEach(() => {
		fixture = directCall();
		UsersMock.findOneById.callsFake(async (uid: string) => ({ _id: uid, username: uid, name: uid, avatarETag: null }));
	});

	it('rings the callee when the caller joins', async () => {
		await service.addUser('call1', 'creator');

		expect(VideoConferenceModelMock.setUsersRingingById.calledWith('call1', ['callee'])).to.be.true;
	});

	it('rings nobody when the callee is the one arriving', async () => {
		await service.addUser('call1', 'callee');

		expect(VideoConferenceModelMock.setUsersRingingById.called).to.be.false;
	});

	// Rejoining must not ring anyone again — the call window's own "ring again" is how a second attempt is asked
	// for.
	it('does not ring someone who has already been rung', async () => {
		fixture = directCall({ ringingAt: new Date('2026-01-01T00:00:00.000Z') });

		await service.addUser('call1', 'creator');

		expect(VideoConferenceModelMock.setUsersRingingById.called).to.be.false;
	});

	it('does not ring someone who already declined', async () => {
		fixture = directCall({ declined: true });

		await service.addUser('call1', 'creator');

		expect(VideoConferenceModelMock.setUsersRingingById.called).to.be.false;
	});

	it('does not ring someone who is already in the call', async () => {
		fixture = directCall({ joined: true, joinedAt: new Date('2026-01-01T00:00:00.000Z') });

		await service.addUser('call1', 'creator');

		expect(VideoConferenceModelMock.setUsersRingingById.called).to.be.false;
	});
});
