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
 * The join-side lifecycle — leaving other calls, claiming busy, ringing the callee — exists for embedded
 * providers, which have a leave, a heartbeat and a sweep to undo all of it. A non-embedded provider has none of
 * those, so its join must look as it always has: the member is added, and nothing is claimed on their behalf.
 * This suite pins both sides of that line; `Presence` and `follow` are observable here because the shared
 * harness has no stubs for them.
 *
 * Following the call's chat thread is the exception, and it is not on that line at all: the thread hangs off the
 * call's message and is read in our own call window's chat panel, so it follows the window rather than the
 * provider — an iframed Jitsi call in our window threads exactly like a call we run ourselves.
 */
const proxyquire = require('proxyquire');

let fixture: VideoConference;

/** Flipped per case: what the service reads through `settings.get`. */
let settingsValues: Record<string, unknown> = {};

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
	'../../settings': { settings: { get: (key: string) => settingsValues[key] } },
});

describe('VideoConfService.addUserToCall provider gating', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		providerCapabilities.current = undefined;
		// Persistent chat fully on and in thread mode, so a join has a thread to follow at all. Discussions have
		// to be on for that, and the E2E keys stay off, since enforced encryption on private rooms switches
		// persistent chat back off. The window belongs to thread mode rather than being incidental to it:
		// without it `getPersistentChatMode` answers `main_room` whatever the mode setting says.
		settingsValues = {
			VideoConf_Enable_Persistent_Chat: true,
			VideoConf_Conference_Window_Enabled: true,
			VideoConf_Persistent_Chat_Mode: 'thread',
			Discussion_enabled: true,
		};
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
	// embedded lifecycle existed — the member is recorded, and nothing is claimed that nothing would release.
	it('only records the member for a non-embedded provider: no other-call sweep, no busy claim, no ring', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'host' })], { messages: { started: 'msg1' } });

		await service.addUser('call1', 'joiner');

		expect(VideoConferenceModelMock.addMemberById.calledWith('call1')).to.be.true;
		expect(VideoConferenceModelMock.setUserJoinedById.calledWith('call1', 'joiner')).to.be.true;

		expect(VideoConferenceModelMock.find.called, 'queried for other calls to leave').to.be.false;
		expect(PresenceMock.setActiveState.called, 'claimed busy').to.be.false;
		expect(ringedUserIds(broadcastStub)).to.deep.equal([]);
	});

	// The other side of the line, so a regression can't pass by never firing the lifecycle for anyone.
	it('runs the whole lifecycle for an embedded provider', async () => {
		providerCapabilities.current = { embedded: true, persistentChat: true };
		fixture = buildGroupCall([buildMember({ _id: 'host' })], { messages: { started: 'msg1' } });

		await service.addUser('call1', 'joiner');

		expect(VideoConferenceModelMock.setUserJoinedById.calledWith('call1', 'joiner')).to.be.true;
		expect(VideoConferenceModelMock.find.called, 'queried for other calls to leave').to.be.true;
		expect(PresenceMock.setActiveState.calledWith('joiner'), 'claimed busy').to.be.true;
		expect(followStub.calledWith({ tmid: 'msg1', uid: 'joiner' }), 'followed the call thread').to.be.true;
	});

	// The complaint behind this: thread mode was on, and the chat panel opened the room. The thread is ours —
	// it hangs off the call's message and is read in our window — so a provider that declares no persistent chat
	// of its own still gets it, and the people in the call are still subscribed to what is said there.
	it('follows the thread for a provider that keeps no chat of its own', async () => {
		providerCapabilities.current = { embedded: true };
		fixture = buildGroupCall([buildMember({ _id: 'host' })], { messages: { started: 'msg1' } });

		await service.addUser('call1', 'joiner');

		expect(followStub.calledWith({ tmid: 'msg1', uid: 'joiner' }), 'followed the call thread').to.be.true;
	});

	// Nor is it the provider's window: a call handed to a provider's own page, held in ours, threads too. This is
	// the pair to the case above — together they say the follow does not ask about the provider at all.
	it('follows the thread for a non-embedded provider', async () => {
		fixture = buildGroupCall([buildMember({ _id: 'host' })], { messages: { started: 'msg1' } });

		await service.addUser('call1', 'joiner');

		expect(followStub.calledWith({ tmid: 'msg1', uid: 'joiner' }), 'followed the call thread').to.be.true;
		// And still none of the embedded lifecycle, which the provider does decide.
		expect(PresenceMock.setActiveState.called, 'claimed busy').to.be.false;
	});
});
