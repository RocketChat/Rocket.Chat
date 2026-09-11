import { expect } from 'chai';
import sinon from 'sinon';

import { buildDirectCall, buildGroupCall, buildMember, commonServiceStubs, providerCapabilities, resetAll } from './testHarness';

/**
 * What the call's own message in the room carries as text.
 *
 * Nothing renders it there — a message with blocks renders those — so the only reader is whatever names a
 * thread: the room's thread list, the thread's header, the notification a reply sends. That is the whole point
 * of it. Where the call's chat is *not* a thread there is nothing to name, and the message stays as it was, so
 * these cases are as much about when the text is absent as when it is there.
 */
const proxyquire = require('proxyquire');

/** Flipped per case, since the answer turns on the two persistent-chat settings. */
let settingsValues: Record<string, unknown> = {};

const sendMessageStub = sinon.stub().resolves({ _id: 'msg1' });

const { VideoConfService } = proxyquire.noCallThru().load('../../../../../server/services/video-conference/service', {
	...commonServiceStubs,
	'@rocket.chat/models': {
		Users: { findOneById: sinon.stub().resolves({ _id: 'creator', username: 'creator.user', name: 'Creator User' }) },
		VideoConference: { findOneById: sinon.stub().resolves(null) },
		Rooms: { findOneById: sinon.stub().resolves({ _id: 'room1', t: 'c', name: 'general', fname: 'general' }) },
		Messages: { setBlocksById: sinon.stub().resolves() },
		Subscriptions: { findByRoomId: sinon.stub().returns({ toArray: sinon.stub().resolves([]) }) },
	},
	'../../lib/messages/sendMessage': { sendMessage: sendMessageStub },
	'../../settings': { settings: { get: (key: string) => settingsValues[key] } },
});

/** The record the service handed to `sendMessage`, which is the thing under test. */
const sentRecord = () => sendMessageStub.firstCall.args[1] as { t: string; msg: string; blocks: unknown[] };

describe('VideoConfService: the call message that names a thread', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		// Persistent chat on and in thread mode, which is what makes the call's message a thread parent. Each case
		// below takes one of these answers away.
		settingsValues = {
			VideoConf_Enable_Persistent_Chat: true,
			VideoConf_Persistent_Chat_Mode: 'thread',
			Discussion_enabled: true,
		};
		providerCapabilities.current = { embedded: true, persistentChat: true };
		resetAll(sendMessageStub);
	});

	it('carries the call name, so the thread is listed under it', async () => {
		await service.createMessage(buildGroupCall([buildMember({ _id: 'creator' })], { title: 'Sprint planning' }));

		expect(sentRecord().msg).to.equal('Sprint planning');
	});

	// The blocks are what the room shows, and they are still the whole of what it shows.
	it('changes nothing else about the message', async () => {
		await service.createMessage(buildGroupCall([buildMember({ _id: 'creator' })]));

		expect(sentRecord().t).to.equal('videoconf');
		expect(sentRecord().blocks).to.have.lengthOf(1);
	});

	// Not the provider's business: the thread hangs off this message and is read in our own call window, so a
	// provider that keeps no chat of its own still gets a named thread. Kept as a case because the name used to
	// depend on that capability, and thread mode consequently did nothing for a Jitsi call.
	it('carries the name for a provider that keeps no chat of its own', async () => {
		providerCapabilities.current = { embedded: true };

		await service.createMessage(buildGroupCall([buildMember({ _id: 'creator' })], { title: 'Sprint planning' }));

		expect(sentRecord().msg).to.equal('Sprint planning');
	});

	// In main-room mode the chat is the room itself and no thread is opened, so there is nothing to name.
	it('says nothing when the chat is not a thread', async () => {
		settingsValues.VideoConf_Persistent_Chat_Mode = 'main_room';

		await service.createMessage(buildGroupCall([buildMember({ _id: 'creator' })], { title: 'Sprint planning' }));

		expect(sentRecord().msg).to.equal('');
	});

	it('says nothing when persistent chat is off entirely', async () => {
		settingsValues.VideoConf_Enable_Persistent_Chat = false;

		await service.createMessage(buildGroupCall([buildMember({ _id: 'creator' })], { title: 'Sprint planning' }));

		expect(sentRecord().msg).to.equal('');
	});

	// A direct call is named after the other person rather than being given a name, so there is none to borrow.
	it('says nothing for a direct call', async () => {
		await service.createMessage(buildDirectCall([buildMember({ _id: 'creator' })]));

		expect(sentRecord().msg).to.equal('');
	});

	// Left as the generic name rather than as a blank line in the thread list.
	it('says nothing for a group call nobody named', async () => {
		await service.createMessage(buildGroupCall([buildMember({ _id: 'creator' })], { title: '   ' }));

		expect(sentRecord().msg).to.equal('');
	});
});
