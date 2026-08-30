import type { IVideoConferenceUser, VideoConference, VideoConferenceCapabilities } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

import { buildGroupCall, buildMember, cloneFixture, createService, resetAll, settingValues } from './testHarness';
import { PRESENCE_LEASE_MS } from '../../../../../lib/videoConference/presence';

const ts = new Date('2026-08-02T10:00:00.000Z');
const at = (offsetMs: number) => new Date(ts.getTime() + offsetMs);

/** The one canonical record, as in `leaveCall.spec`: reads are copies of it and the write stubs mutate it. */
let fixture: VideoConference;

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
		resetAll(
			VideoConferenceModelMock.findOneById,
			VideoConferenceModelMock.findActiveWithMembers,
			VideoConferenceModelMock.setUserLeftById,
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

	// One bad call must not cost every other call its sweep: the loop catches per call, and this is what says so.
	it('carries on to the next call when one of them fails', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'gone', lastSeenAt: at(-PRESENCE_LEASE_MS) })]);
		const second = buildGroupCall([buildMember({ _id: 'gone2', lastSeenAt: at(-PRESENCE_LEASE_MS) })], { _id: 'call2' });
		VideoConferenceModelMock.findActiveWithMembers.callsFake(() => ({
			async *[Symbol.asyncIterator]() {
				yield cloneFixture(fixture);
				yield cloneFixture(second);
			},
		}));
		VideoConferenceModelMock.setUserLeftById.withArgs('call1').rejects(new Error('write failed'));

		await service.expirePresenceLeases(at(0));

		expect(VideoConferenceModelMock.setUserLeftById.calledWith('call2', 'gone2')).to.be.true;
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

		afterEach(() => {
			delete settingValues.VideoConf_Conference_Window_Enabled;
		});

		// Handed off to the provider's own page, so nothing of ours is there to renew a lease: every one of them
		// would look expired and the sweep would end the call after three minutes. The 24-hour TTL cron has these.
		it('skips calls from non-embedded providers (Jitsi, Meet, etc.)', async () => {
			fixture = buildGroupCall([buildMember({ _id: 'jitsiUser', lastSeenAt: at(-PRESENCE_LEASE_MS * 2) })]);

			await nonEmbeddedService.expirePresenceLeases(at(0));

			expect(NonEmbeddedModelMock.setUserLeftById.called).to.be.false;
			expect(fixture.status).to.equal(VideoConferenceStatus.STARTED);
		});

		// The setting says what a call opened *now* would do, and the sweep meets calls opened before it. One
		// created while the window was off was handed to the provider's own page and never heartbeats — yet
		// joining stamps `lastSeenAt` whatever the provider — so sweeping on the setting would expire its members
		// three minutes after the toggle and end a call still running in Jitsi.
		it('still skips a non-embedded call when the conference window is enabled', async () => {
			settingValues.VideoConf_Conference_Window_Enabled = true;
			fixture = buildGroupCall([buildMember({ _id: 'jitsiUser', lastSeenAt: at(-PRESENCE_LEASE_MS * 2) })]);

			await nonEmbeddedService.expirePresenceLeases(at(0));

			expect(NonEmbeddedModelMock.setUserLeftById.called).to.be.false;
			expect(fixture.status).to.equal(VideoConferenceStatus.STARTED);
		});
	});
});
