import type { IVideoConferenceUser, VideoConference, VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

import { buildGroupCall, buildMember, cloneFixture, createService, resetAll } from './testHarness';
import { PRESENCE_LEASE_MS } from '../../../../../lib/videoConference/presence';

const ts = new Date('2026-08-02T10:00:00.000Z');
const at = (offsetMs: number) => new Date(ts.getTime() + offsetMs);

/** The one canonical record, as in `leaveCall.spec`: reads are copies of it and the write stubs mutate it. */
let fixture: VideoConference;

/** What the provider answers when asked who is in the room, or `undefined` for "no answer". */
let present: string[] | undefined;
let probe: sinon.SinonStub | undefined;

const VideoConferenceModelMock = {
	findOneById: sinon.stub().callsFake(async () => cloneFixture(fixture)),
	// A real cursor is async-iterable, which is how the sweep walks it.
	findActiveWithMembers: sinon.stub().callsFake(() => ({
		async *[Symbol.asyncIterator]() {
			yield cloneFixture(fixture);
		},
	})),
	setUserLeftById: sinon.stub().callsFake(async (_callId: string, uid: string, leftAt: Date) => {
		const member = fixture.users.find((user) => user._id === uid);
		if (member) {
			(member as IVideoConferenceUser).leftAt = leftAt;
		}
	}),
	renewUsersPresenceById: sinon.stub().resolves(),
	setDataById: sinon.stub().callsFake(async (_callId: string, data: Partial<VideoConference>) => {
		Object.assign(fixture, data);
	}),
	setStatusById: sinon.stub().callsFake(async (_callId: string, status: VideoConference['status']) => {
		fixture.status = status;
	}),
};

const UsersMock = { findOneById: sinon.stub().resolves(null) };

const VideoConfService = createService({
	models: {
		Users: UsersMock,
		VideoConference: VideoConferenceModelMock,
	},
	overrides: {
		'../../lib/videoConfPresence': { videoConfPresence: { getProbe: () => probe } },
		'../../lib/videoConfProviders': {
			videoConfProviders: {
				getProviderCapabilities: () => ({ embedded: true }),
			},
		},
	},
});

describe('VideoConfService.expirePresenceLeases', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		present = undefined;
		probe = undefined;
		resetAll(
			VideoConferenceModelMock.findOneById,
			VideoConferenceModelMock.findActiveWithMembers,
			VideoConferenceModelMock.setUserLeftById,
			VideoConferenceModelMock.renewUsersPresenceById,
			VideoConferenceModelMock.setDataById,
			VideoConferenceModelMock.setStatusById,
		);
		// `resetAll` only clears history — restore the single-call cursor for the tests that replace it.
		VideoConferenceModelMock.findActiveWithMembers.callsFake(() => ({
			async *[Symbol.asyncIterator]() {
				yield cloneFixture(fixture);
			},
		}));
	});

	// The case this exists for: the workspace was down while the call carried on in the provider, so the leave
	// never reached anyone. Nothing was reported and nothing had to be — the missing renewals are the evidence.
	it('marks a member whose lease ran out as having left', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'staying', lastSeenAt: at(0) }),
			buildMember({ _id: 'gone', lastSeenAt: at(-PRESENCE_LEASE_MS) }),
		]);

		await service.expirePresenceLeases(at(0));

		expect(VideoConferenceModelMock.setUserLeftById.calledOnce).to.be.true;
		const [callId, uid, leftAt, reason] = VideoConferenceModelMock.setUserLeftById.firstCall.args;
		expect({ callId, uid, reason }).to.deep.equal({ callId: 'call1', uid: 'gone', reason: 'timeout' });
		expect(leftAt).to.deep.equal(at(-PRESENCE_LEASE_MS));
	});

	it('leaves a member who is still renewing alone', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'staying', lastSeenAt: at(-1_000) })]);

		await service.expirePresenceLeases(at(0));

		expect(VideoConferenceModelMock.setUserLeftById.called).to.be.false;
		expect(fixture.status).to.equal(VideoConferenceStatus.STARTED);
	});

	// The call has to *end*, not just empty: ending is what writes everyone's history, and a call left open is a
	// call the room keeps offering to join. No second grace period — the lease was one, and a long one.
	it('ends the call when the last lease expires', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'gone', lastSeenAt: at(-PRESENCE_LEASE_MS) })]);

		await service.expirePresenceLeases(at(0));

		expect(fixture.status).to.equal(VideoConferenceStatus.ENDED);
	});

	it('keeps the call open while anyone is still in it', async () => {
		fixture = buildGroupCall([
			buildMember({ _id: 'staying', lastSeenAt: at(0) }),
			buildMember({ _id: 'gone', lastSeenAt: at(-PRESENCE_LEASE_MS) }),
		]);

		await service.expirePresenceLeases(at(0));

		expect(fixture.status).to.equal(VideoConferenceStatus.STARTED);
	});

	describe('when the provider can say who is in the room', () => {
		beforeEach(() => {
			probe = sinon.stub().callsFake(async () => present);
		});

		// Why asking the provider is worth anything at all: a window that isn't in front has its timers throttled
		// by the browser, so the member most likely to look absent is someone listening while they work.
		it('holds on to a member the provider can see, whatever their heartbeat did', async () => {
			present = ['throttled'];
			fixture = buildGroupCall([buildMember({ _id: 'throttled', lastSeenAt: at(-PRESENCE_LEASE_MS * 2) })]);

			await service.expirePresenceLeases(at(0));

			expect(VideoConferenceModelMock.setUserLeftById.called).to.be.false;
			expect(VideoConferenceModelMock.renewUsersPresenceById.calledWith('call1', ['throttled'], at(0))).to.be.true;
			expect(fixture.status).to.equal(VideoConferenceStatus.STARTED);
		});

		// Silence is not absence. A provider we cannot reach must not be able to empty a call — that would turn
		// our own network trouble into everyone else's departure.
		it('changes nothing about a lease when the provider cannot be asked', async () => {
			present = undefined;
			fixture = buildGroupCall([buildMember({ _id: 'staying', lastSeenAt: at(-1_000) })]);

			await service.expirePresenceLeases(at(0));

			expect(VideoConferenceModelMock.renewUsersPresenceById.called).to.be.false;
			expect(VideoConferenceModelMock.setUserLeftById.called).to.be.false;
		});

		// An empty array is the provider stating the room is empty, unlike `undefined`. It renews nobody, so the
		// leases decide — which they do at their own pace rather than instantly.
		it('lets the leases decide when the provider reports an empty room', async () => {
			present = [];
			fixture = buildGroupCall([buildMember({ _id: 'fresh', lastSeenAt: at(-1_000) })]);

			await service.expirePresenceLeases(at(0));

			expect(VideoConferenceModelMock.renewUsersPresenceById.called).to.be.false;
			expect(VideoConferenceModelMock.setUserLeftById.called).to.be.false;
		});

		// A probe that fails is silence, same as a provider with no probe at all: the leases still get judged on
		// their own evidence. Anything else lets an unreachable provider keep its crashed members present forever —
		// the exact situation the sweep exists to clean up.
		it('still expires the leases when the probe fails', async () => {
			probe = sinon.stub().rejects(new Error('LiveKit is unreachable'));
			fixture = buildGroupCall([
				buildMember({ _id: 'staying', lastSeenAt: at(0) }),
				buildMember({ _id: 'gone', lastSeenAt: at(-PRESENCE_LEASE_MS) }),
			]);

			await service.expirePresenceLeases(at(0));

			expect(VideoConferenceModelMock.setUserLeftById.calledWith('call1', 'gone')).to.be.true;
			expect(VideoConferenceModelMock.setUserLeftById.calledOnce, 'a failed probe must not evict the fresh lease').to.be.true;
		});

		// And a failing probe on one call must not stop the sweep before it reaches the next one.
		it('carries on to the next call when a probe fails', async () => {
			probe = sinon.stub().rejects(new Error('LiveKit is unreachable'));
			fixture = buildGroupCall([buildMember({ _id: 'gone', lastSeenAt: at(-PRESENCE_LEASE_MS) })]);
			const second = buildGroupCall([buildMember({ _id: 'gone2', lastSeenAt: at(-PRESENCE_LEASE_MS) })], { _id: 'call2' });
			VideoConferenceModelMock.findActiveWithMembers.callsFake(() => ({
				async *[Symbol.asyncIterator]() {
					yield cloneFixture(fixture);
					yield cloneFixture(second);
				},
			}));

			await service.expirePresenceLeases(at(0));

			expect(VideoConferenceModelMock.setUserLeftById.calledWith('call1', 'gone')).to.be.true;
			expect(VideoConferenceModelMock.setUserLeftById.calledWith('call2', 'gone2')).to.be.true;
		});
	});

	describe('non-embedded providers', () => {
		const NonEmbeddedModelMock = {
			findActiveWithMembers: sinon.stub().callsFake(() => ({
				async *[Symbol.asyncIterator]() {
					yield cloneFixture(fixture);
				},
			})),
			setUserLeftById: sinon.stub().resolves(),
			setDataById: sinon.stub().resolves(),
			setStatusById: sinon.stub().resolves(),
		};

		const NonEmbeddedService = createService({
			models: { VideoConference: NonEmbeddedModelMock },
			overrides: {
				'../../lib/videoConfProviders': {
					videoConfProviders: {
						getProviderCapabilities: (): VideoConferenceCapabilities => ({}),
					},
				},
			},
		});

		let nonEmbeddedService: any;

		beforeEach(() => {
			nonEmbeddedService = new NonEmbeddedService();
			resetAll(NonEmbeddedModelMock.setUserLeftById, NonEmbeddedModelMock.setDataById, NonEmbeddedModelMock.setStatusById);
		});

		it('skips calls from non-embedded providers (Jitsi, Meet, etc.)', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'jitsiUser', lastSeenAt: at(-PRESENCE_LEASE_MS * 2) })]);

			await nonEmbeddedService.expirePresenceLeases(at(0));

			expect(NonEmbeddedModelMock.setUserLeftById.called).to.be.false;
			expect(fixture.status).to.equal(VideoConferenceStatus.STARTED);
		});
	});
});
