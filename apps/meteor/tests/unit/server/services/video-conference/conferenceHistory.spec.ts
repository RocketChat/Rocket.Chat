import type { VideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { buildGroupCall, buildMember, createService, resetAll } from './testHarness';

/**
 * That the service writes call history at the right moments, and says whether the call is over.
 *
 * *What* it writes for each member — ongoing while it runs, ended or not-answered once it stops, counting only
 * the people who were actually in it — is `buildConferenceCallHistoryItems`, a pure function pinned in
 * `tests/unit/lib/videoConference/callHistory.spec.ts`. Restating that mapping through the whole service only
 * made the same rules harder to change.
 */

let call: VideoConference;

const VideoConferenceModelMock = {
	findOneById: sinon.stub().callsFake(async () => call),
	addMemberById: sinon.stub().resolves(),
	setUserJoinedById: sinon.stub().resolves(),
	setUsersRingingById: sinon.stub().resolves(),
	setDataById: sinon.stub().resolves(),
	setStatusById: sinon.stub().resolves(),
	setUserLeftById: sinon.stub().resolves(),
	find: sinon.stub().returns({ toArray: async () => [] }),
};

const CallHistoryMock = {
	upsertMany: sinon.stub().resolves(),
};

const VideoConfService = createService({
	models: {
		VideoConference: VideoConferenceModelMock,
		CallHistory: CallHistoryMock,
		Users: {
			findOneById: sinon.stub().callsFake(async (uid: string) => ({ _id: uid, username: uid, name: uid, avatarETag: null })),
			find: sinon.stub().returns({ toArray: async () => [] }),
		},
		Rooms: { findOneById: sinon.stub().resolves({ _id: 'room1', t: 'p' }) },
	},
});

/** What the last write said about each member. */
const lastWrite = () => CallHistoryMock.upsertMany.lastCall.args[0] as { uid: string; state: string }[];

describe('VideoConfService: a conference in its members history', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		resetAll(VideoConferenceModelMock.findOneById, VideoConferenceModelMock.setUserJoinedById, CallHistoryMock.upsertMany);
		call = buildGroupCall([buildMember({ _id: 'creator' }), buildMember({ _id: 'invited', joined: false, joinedAt: undefined })]);
	});

	// The whole point of logging a call from the start: the history is the one list of calls, and a call in
	// progress belongs in it — which is also what gives someone who declined a way back into it.
	it('writes the call as still running when someone joins', async () => {
		await service.addUser('call1', 'invited');

		expect(CallHistoryMock.upsertMany.called).to.be.true;
		expect(lastWrite().map(({ uid }) => uid)).to.include('invited');
		expect(lastWrite().every(({ state }) => state === 'ongoing')).to.be.true;
	});

	// Each member's own outcome only exists once the call is over.
	it('settles the members states when the call ends', async () => {
		await service.endCall('call1');

		const written = lastWrite();
		expect(written.find(({ uid }) => uid === 'creator')).to.include({ state: 'ended' });
		expect(written.find(({ uid }) => uid === 'invited')).to.include({ state: 'not-answered' });
	});

	// A livechat call belongs to a visitor rather than to a user's own log, and a VoIP conference is already
	// logged as a media call.
	it('logs nothing for a conference that does not belong in a user call log', async () => {
		call = { ...buildGroupCall([buildMember({ _id: 'creator' })]), type: 'livechat' } as unknown as VideoConference;

		await service.endCall('call1');

		expect(CallHistoryMock.upsertMany.called).to.be.false;
	});
});
