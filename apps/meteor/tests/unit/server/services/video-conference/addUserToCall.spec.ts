import type { VideoConference } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import sinon from 'sinon';

import {
	buildGroupCall,
	buildMember,
	cloneFixture,
	commonServiceStubs,
	providerCapabilities,
	resetAll,
	ringedUserIds,
} from './testHarness';

/**
 * What joining a call does *besides* recording the join, and for whom.
 *
 * The join-side lifecycle — leaving other calls, claiming busy, following the chat thread, ringing the callee —
 * exists for embedded providers, which have a leave, a heartbeat and a sweep to undo all of it. A non-embedded
 * provider has none of those, so its join must look exactly as it always has: the member is added, and nothing
 * else happens. This suite pins both sides of that line; `Presence` and `follow` are observable here because the
 * shared harness has no stubs for them.
 */
const proxyquire = require('proxyquire');

let fixture: VideoConference;

const PresenceMock = {
	setActiveState: sinon.stub().resolves(true),
	endActiveState: sinon.stub().resolves(true),
};

const followStub = sinon.stub().resolves();

const VideoConferenceModelMock = {
	findOneById: sinon.stub().callsFake(async () => cloneFixture(fixture)),
	addMemberById: sinon.stub().resolves(),
	setUserJoinedById: sinon.stub().resolves(),
	setStatusById: sinon.stub().resolves(),
	setRingingById: sinon.stub().resolves(),
	setUsersRingingById: sinon.stub().resolves(),
	find: sinon.stub().returns({ toArray: async () => [] }),
};

const UsersMock = { findOneById: sinon.stub().resolves({ _id: 'joiner', username: 'joiner.user', name: 'Joiner', avatarETag: null }) };

const broadcastStub = sinon.stub().resolves();

const { VideoConfService } = proxyquire.noCallThru().load('../../../../../server/services/video-conference/service', {
	...commonServiceStubs,
	'@rocket.chat/core-services': {
		api: { broadcast: broadcastStub },
		ServiceClassInternal: class {
			onEvent() {
				/* no-op */
			}
		},
		Message: { saveSystemMessage: sinon.stub().resolves() },
		Room: { addUserToRoom: sinon.stub().resolves() },
		Presence: PresenceMock,
	},
	'@rocket.chat/models': {
		Users: UsersMock,
		VideoConference: VideoConferenceModelMock,
		Rooms: { findOneById: sinon.stub().resolves(null) },
		Messages: { setBlocksById: sinon.stub().resolves() },
		Subscriptions: {
			findByRoomIdAndNotUserId: sinon.stub().returns({ toArray: sinon.stub().resolves([]), forEach: sinon.stub().resolves() }),
		},
	},
	'../../lib/messaging/threads/functions': { follow: followStub },
	// Persistent chat fully on, in thread mode, with the window that gives thread mode its meaning: what proves
	// the *provider* gate below is the gate that held. Discussions have to be on for that, and the E2E keys stay
	// off, since enforced encryption on private rooms switches persistent chat back off.
	'../../settings': {
		settings: {
			get: (key: string) =>
				(
					({
						VideoConf_Enable_Persistent_Chat: true,
						VideoConf_Conference_Window_Enabled: true,
						VideoConf_Persistent_Chat_Mode: 'thread',
						Discussion_enabled: true,
					}) as Record<string, unknown>
				)[key],
		},
	},
});

describe('VideoConfService.addUserToCall provider gating', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		providerCapabilities.current = undefined;
		resetAll(
			PresenceMock.setActiveState,
			PresenceMock.endActiveState,
			followStub,
			VideoConferenceModelMock.findOneById,
			VideoConferenceModelMock.addMemberById,
			VideoConferenceModelMock.setUserJoinedById,
			VideoConferenceModelMock.find,
			broadcastStub,
		);
	});

	afterEach(() => {
		providerCapabilities.current = undefined;
	});

	// The invariant the gating exists for: a Jitsi/Meet/BBB join must have exactly the effects it had before the
	// embedded lifecycle existed — the member is recorded, and nothing else fires.
	it('only records the member for a non-embedded provider: no other-call sweep, no busy claim, no follow, no ring', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'host' })], { messages: { started: 'msg1' } });

		await service.addUser('call1', 'joiner');

		expect(VideoConferenceModelMock.addMemberById.calledWith('call1')).to.be.true;
		expect(VideoConferenceModelMock.setUserJoinedById.calledWith('call1', 'joiner')).to.be.true;

		expect(VideoConferenceModelMock.find.called, 'queried for other calls to leave').to.be.false;
		expect(PresenceMock.setActiveState.called, 'claimed busy').to.be.false;
		expect(followStub.called, 'followed the call thread').to.be.false;
		expect(ringedUserIds(broadcastStub)).to.deep.equal([]);
	});

	// The other side of the line, so a regression can't pass by never firing the lifecycle for anyone.
	it('runs the whole lifecycle for an embedded provider that supports persistent chat', async () => {
		providerCapabilities.current = { embedded: true, persistentChat: true };
		fixture = buildGroupCall([buildMember({ _id: 'host' })], { messages: { started: 'msg1' } });

		await service.addUser('call1', 'joiner');

		expect(VideoConferenceModelMock.setUserJoinedById.calledWith('call1', 'joiner')).to.be.true;
		expect(VideoConferenceModelMock.find.called, 'queried for other calls to leave').to.be.true;
		expect(PresenceMock.setActiveState.calledWith('joiner'), 'claimed busy').to.be.true;
		expect(followStub.calledWith({ tmid: 'msg1', uid: 'joiner' }), 'followed the call thread').to.be.true;
	});

	// Fix for thread auto-follow firing for providers that never declared persistent chat support: the setting
	// being on is not enough — the provider has to be able to honor it, same as the discussion path.
	it('does not follow the thread for an embedded provider without the persistentChat capability', async () => {
		providerCapabilities.current = { embedded: true };
		fixture = buildGroupCall([buildMember({ _id: 'host' })], { messages: { started: 'msg1' } });

		await service.addUser('call1', 'joiner');

		expect(VideoConferenceModelMock.setUserJoinedById.calledWith('call1', 'joiner')).to.be.true;
		expect(followStub.called).to.be.false;
	});
});
