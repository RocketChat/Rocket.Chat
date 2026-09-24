import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import sinon from 'sinon';

import { createService, resetAll } from './testHarness';

const findOneByProviderNameAndSipAlias = sinon.stub();
const createGroup = sinon.stub().resolves('call1');
const findOneById = sinon.stub();
const addUserToRoom = sinon.stub().resolves();
const createRoom = sinon.stub().resolves({ _id: 'discussion1' });

const settingValues: Record<string, unknown> = {};

const user = { _id: 'user1', name: 'User One', username: 'user.one' };

const VideoConfService = createService({
	models: {
		VideoConference: { findOneByProviderNameAndSipAlias, createGroup },
		Users: { findOneById },
		Rooms: { findOneById: sinon.stub().resolves({ _id: 'parent1', t: 'c' }) },
	},
	overrides: {
		'../../settings': { settings: { get: (key: string) => settingValues[key] } },
		'../../lib/rooms/createRoom': { createRoom },
		'@rocket.chat/core-services': {
			api: { broadcast: sinon.stub().resolves() },
			ServiceClassInternal: class {
				onEvent() {
					/* no-op */
				}
			},
			Message: { saveSystemMessage: sinon.stub().resolves() },
			Room: { addUserToRoom },
		},
	},
});

describe('VideoConfService.initializeOrJoinScheduledConference', () => {
	let service: any;

	beforeEach(() => {
		service = new VideoConfService();
		resetAll(findOneByProviderNameAndSipAlias, createGroup, findOneById, addUserToRoom, createRoom);
		[findOneByProviderNameAndSipAlias, createGroup, findOneById, addUserToRoom, createRoom].forEach((stub) => stub.resetBehavior());

		findOneByProviderNameAndSipAlias.resolves(null);
		createGroup.resolves('call1');
		findOneById.resolves(user);
		addUserToRoom.resolves();
		createRoom.resolves({ _id: 'discussion1' });

		settingValues.Pexip_Integration_Enabled = true;
		settingValues.Pexip_Integration_SIP_AddAlias = true;
		settingValues.Pexip_Integration_PersistentChat_ExternalRoom = [{ _id: 'external1' }];
	});

	// The alias is only meaningful while the workspace hands them out; without that there is nothing it names.
	it('should refuse when Pexip is off', async () => {
		settingValues.Pexip_Integration_Enabled = false;

		await expect(service.initializeOrJoinScheduledConference('12345678', 'user1')).to.be.rejectedWith('feature-disabled');
	});

	it('should refuse when aliases are not being handed out', async () => {
		settingValues.Pexip_Integration_SIP_AddAlias = false;

		await expect(service.initializeOrJoinScheduledConference('12345678', 'user1')).to.be.rejectedWith('feature-disabled');
	});

	it('should look the alias up scoped to the internal Pexip provider', async () => {
		await service.initializeOrJoinScheduledConference('12345678', 'user1');

		expect(findOneByProviderNameAndSipAlias.firstCall.args[0]).to.equal('core.pexip');
		expect(findOneByProviderNameAndSipAlias.firstCall.args[1]).to.equal('12345678');
	});

	describe('when the alias has never been dialled', () => {
		it('should build the conference on the room the workspace named for them', async () => {
			await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(createGroup.firstCall.args[0]).to.include({ rid: 'external1', sipAlias: '12345678' });
		});

		// The alias is the only thing the caller supplied, so it stands in as the name until one is set.
		it('should title the conference after the alias', async () => {
			await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(createGroup.firstCall.args[0].title).to.equal('12345678');
		});

		// `createGroup` takes the discussion, so the chat has to exist before the conference does.
		it('should create the chat first and hand it to the conference', async () => {
			await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(createRoom.calledBefore(createGroup)).to.be.true;
			expect(createGroup.firstCall.args[0].discussionRid).to.equal('discussion1');
		});

		// Nobody is being asked to answer: whoever dials the alias arrives of their own accord.
		it('should not ring', async () => {
			await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(createGroup.firstCall.args[0]).to.not.have.property('ringing');
		});

		it('should refuse when no room has been named for external conferences', async () => {
			settingValues.Pexip_Integration_PersistentChat_ExternalRoom = '';

			await expect(service.initializeOrJoinScheduledConference('12345678', 'user1')).to.be.rejectedWith('invalid-room');
			expect(createGroup.called).to.be.false;
		});
	});

	describe('when the alias already stands for a conference', () => {
		beforeEach(() => {
			findOneByProviderNameAndSipAlias.resolves({ _id: 'existing1', discussionRid: 'discussion9' });
		});

		it('should join that conference rather than building another', async () => {
			const callId = await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(callId).to.equal('existing1');
			expect(createGroup.called).to.be.false;
		});

		it('should subscribe the caller to the chat that is already there', async () => {
			await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(addUserToRoom.calledWith('discussion9', { _id: 'user1' })).to.be.true;
		});

		// Failing to subscribe somebody is not a reason to keep them out of the call.
		it('should still join when subscribing to the chat fails', async () => {
			addUserToRoom.rejects(new Error('no such room'));

			const callId = await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(callId).to.equal('existing1');
		});

		it('should do nothing about a chat when the conference has none', async () => {
			findOneByProviderNameAndSipAlias.resolves({ _id: 'existing1' });

			await service.initializeOrJoinScheduledConference('12345678', 'user1');

			expect(addUserToRoom.called).to.be.false;
		});
	});
});
