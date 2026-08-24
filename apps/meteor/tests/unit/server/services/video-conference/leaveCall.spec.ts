import type { IVideoConferenceUser, VideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

import { buildDirectCall, buildGroupCall, buildMember, cloneFixture, createService, resetAll } from './testHarness';

/** Must match the constant defined in the service. */
const EMPTY_CALL_GRACE_MS = 10_000;

// `VideoConference.findOneById` is hit more than once per `leaveCall` → `endCall` flow, with different
// projections (`leaveCall` reads `{ rid, users, endedAt }`, `endCall`'s `getUnfiltered` reads everything). A
// real DB would answer both from the same document, so `fixture` is the single canonical record and the
// mutating model methods below write into it, regardless of the projection asked for.
let fixture: VideoConference;

const VideoConferenceModelMock = {
	// `endCall`'s `getUnfiltered` is `VideoConfService.getUnfiltered`, which itself just calls
	// `VideoConference.findOneById(callId)` with no projection — there's no separate model method to stub.
	findOneById: sinon.stub().callsFake(async () => cloneFixture(fixture)),
	setUserLeftById: sinon.stub().callsFake(async (_callId: string, uid: string, leftAt: Date) => {
		const member = fixture.users.find((user) => user._id === uid);
		if (member) {
			(member as IVideoConferenceUser).leftAt = leftAt;
		}
	}),
	setDataById: sinon.stub().callsFake(async (_callId: string, data: Partial<VideoConference>) => {
		Object.assign(fixture, data);
	}),
	setStatusById: sinon.stub().callsFake(async (_callId: string, status: VideoConference['status']) => {
		fixture.status = status;
	}),
	find: sinon.stub().returns({ toArray: async () => [] }),
	addMemberById: sinon.stub().resolves(),
	setUserJoinedById: sinon.stub().resolves(),
};

const UsersMock = {
	findOneById: sinon.stub().resolves(null),
};

const VideoConfService = createService({
	models: {
		Users: UsersMock,
		VideoConference: VideoConferenceModelMock,
	},
	// This suite is about what happens when a call empties, so the ringing the service would otherwise do on a
	// join is stubbed out of the way.
	overrides: {
		'../../../lib/videoConference/constants': { availabilityErrors: {}, shouldRingVideoConference: () => false },
	},
});

describe('VideoConfService.leaveCall', () => {
	let service: any;

	let clock: sinon.SinonFakeTimers;

	/** The call empties, then the grace period passes with nobody having come back. */
	const leaveAndSettle = async (uid: string) => {
		await service.leaveCall(uid, 'call1');
		await clock.tickAsync(EMPTY_CALL_GRACE_MS + 1);
	};

	beforeEach(() => {
		clock = sinon.useFakeTimers({ shouldAdvanceTime: false });
		service = new VideoConfService();
		resetAll(
			VideoConferenceModelMock.findOneById,
			VideoConferenceModelMock.setUserLeftById,
			VideoConferenceModelMock.setDataById,
			VideoConferenceModelMock.setStatusById,
		);
		VideoConferenceModelMock.findOneById.callsFake(async () => cloneFixture(fixture));
	});

	afterEach(() => {
		clock.restore();
	});

	// The reported bug: leaving the last-standing spot in a call must end it and leave every member a
	// history entry, not just silently mark the leaver as gone. `creator` already left earlier, so `other`
	// is genuinely the last one still in the call — this is what makes it "the last participant leaves"
	// rather than just "one of several leaves".
	it('ends the call when the last participant leaves', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'creator', leftAt: new Date('2026-01-01T00:30:00.000Z') }),
			buildMember({ _id: 'other' }),
		]);

		await leaveAndSettle('other');

		expect(fixture.status).to.equal(VideoConferenceStatus.ENDED);
		expect(fixture.endedAt).to.be.instanceOf(Date);
	});

	// Someone leaving while others remain must not end the call for them.
	it('marks the member as left without ending the call when others remain', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'creator' }), buildMember({ _id: 'other' })]);

		await service.leaveCall('other', 'call1');

		expect(fixture.status).to.equal(VideoConferenceStatus.STARTED);
		expect(fixture.endedAt).to.be.undefined;

		const leaver = fixture.users.find((user) => user._id === 'other');
		expect(leaver?.leftAt).to.be.instanceOf(Date);
	});

	it('ends a direct (1:1) conference when the last participant leaves', async () => {
		fixture = buildDirectCall([
			buildMember({ _id: 'creator', leftAt: new Date('2026-01-01T00:30:00.000Z') }),
			buildMember({ _id: 'other' }),
		]);

		await leaveAndSettle('other');

		expect(fixture.status).to.equal(VideoConferenceStatus.ENDED);
	});

	// A conference that already ended (already carries `endedAt`) must not be re-processed at all — this is
	// the guard `leaveCall` itself applies before touching anything.
	it('does not re-process a conference that already has endedAt', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'creator' }), buildMember({ _id: 'other', leftAt: new Date() })], {
			status: VideoConferenceStatus.ENDED,
			endedAt: new Date('2026-01-01T01:00:00.000Z'),
		});

		await service.leaveCall('creator', 'call1');

		expect(VideoConferenceModelMock.setUserLeftById.called).to.be.false;
	});

	// A member who was added to the conference but never joined (`joined: false`) has no active presence in
	// the call — they must not hold it open once the only member who actually joined leaves.
	it('ends the call when the leaver is the only joined member, even with an unjoined member still on the roster', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'creator' }), buildMember({ _id: 'neverJoined', joined: false, joinedAt: undefined })]);

		await leaveAndSettle('creator');

		expect(fixture.status).to.equal(VideoConferenceStatus.ENDED);
	});

	// `pagehide` fires on a reload exactly as it does on a close, so ending the moment the call empties meant
	// refreshing the call window killed the call. Coming back inside the grace period must cancel it.
	it('does not end the call when the last participant comes back inside the grace period', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'creator' })]);

		await service.leaveCall('creator', 'call1');

		// The rejoin: what the client's own join does to the entry, which is all isInVideoConference reads.
		const rejoiner = fixture.users.find((user) => user._id === 'creator');
		delete rejoiner?.leftAt;

		await clock.tickAsync(EMPTY_CALL_GRACE_MS + 1);

		expect(fixture.status).to.equal(VideoConferenceStatus.STARTED);
		expect(fixture.endedAt).to.be.undefined;
	});

	it('still ends the call when nobody comes back', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'creator' })]);

		await service.leaveCall('creator', 'call1');
		expect(fixture.endedAt, 'ended before the grace period elapsed').to.be.undefined;

		await clock.tickAsync(EMPTY_CALL_GRACE_MS + 1);

		expect(fixture.status).to.equal(VideoConferenceStatus.ENDED);
	});
});

describe('VideoConfService one call at a time', () => {
	let clock: sinon.SinonFakeTimers;
	let service: any;

	/** The conferences the model answers about, by id — a join reads the one being joined and any other it finds. */
	let calls: Record<string, VideoConference>;

	beforeEach(() => {
		clock = sinon.useFakeTimers({ shouldAdvanceTime: false });
		service = new VideoConfService();
		calls = {};
		resetAll(
			VideoConferenceModelMock.findOneById,
			VideoConferenceModelMock.setUserLeftById,
			VideoConferenceModelMock.find,
			VideoConferenceModelMock.addMemberById,
			VideoConferenceModelMock.setUserJoinedById,
			UsersMock.findOneById,
		);
		VideoConferenceModelMock.findOneById.callsFake(async (callId: string) => calls[callId]);
		UsersMock.findOneById.resolves({ _id: 'joiner', username: 'joiner.user', name: 'Joiner', avatarETag: null });
	});

	afterEach(() => {
		clock.restore();
		VideoConferenceModelMock.findOneById.callsFake(async () => cloneFixture(fixture));
		UsersMock.findOneById.resolves(null);
	});

	/** `other` is a call this user is in, alongside the `wanted` one they are about to join. */
	const joinWhileIn = async (other: VideoConference) => {
		calls = { wanted: buildGroupCall([buildMember({ _id: 'host' })], { _id: 'wanted' }), [other._id]: other };
		VideoConferenceModelMock.find.returns({ toArray: async () => [other] });

		await service.addUser('wanted', 'joiner');
	};

	// A window that dies without reporting its departure — a crash, a killed tab — leaves its user counted as
	// present forever, which both misreports them and keeps a finished call listed as occupied. Joining anything
	// is the moment that can be put right.
	it('leaves the call a joining user is still counted as being in', async () => {
		await joinWhileIn(buildGroupCall([buildMember({ _id: 'joiner' })], { _id: 'stale' }));

		expect(VideoConferenceModelMock.setUserLeftById.calledWith('stale', 'joiner')).to.be.true;
	});

	it('joins the wanted call all the same', async () => {
		await joinWhileIn(buildGroupCall([buildMember({ _id: 'joiner' })], { _id: 'stale' }));

		expect(VideoConferenceModelMock.setUserJoinedById.calledWith('wanted', 'joiner')).to.be.true;
	});

	// The query is the whole rule, so it is what this asserts: another call, still running, and one this user is
	// *present* in. Membership of a call already left is not presence in it — leaving it again would write a later
	// `leftAt` over the real one — and an entry with no `joined` flag predates the flag and counts as present.
	it('asks only about the calls it should leave', async () => {
		await joinWhileIn(buildGroupCall([buildMember({ _id: 'joiner' })], { _id: 'stale' }));

		const [query] = VideoConferenceModelMock.find.firstCall.args;
		expect(query).to.deep.equal({
			_id: { $ne: 'wanted' },
			endedAt: { $exists: false },
			users: { $elemMatch: { _id: 'joiner', joined: { $ne: false }, leftAt: { $exists: false } } },
		});
	});
});
