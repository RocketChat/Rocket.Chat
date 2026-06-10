import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const mocks = {
	Rooms: {
		findOneById: sandbox.stub(),
		setNameById: sandbox.stub().resolves({ modifiedCount: 1 }),
		setFnameById: sandbox.stub().resolves({ modifiedCount: 1 }),
	},
	Subscriptions: {
		updateNameAndAlertByRoomId: sandbox.stub().resolves({ modifiedCount: 1 }),
		updateNameAndFnameByRoomId: sandbox.stub().resolves({ modifiedCount: 1 }),
		updateFnameByRoomId: sandbox.stub().resolves({ modifiedCount: 1 }),
	},
	Integrations: {
		updateRoomName: sandbox.stub().resolves(),
	},
	Message: {
		saveSystemMessage: sandbox.stub().resolves(),
	},
	Room: {
		beforeNameChange: sandbox.stub().resolves(),
	},
	roomCoordinator: {
		getRoomDirectives: sandbox.stub().returns({ preventRenaming: () => false }),
	},
	checkUsernameAvailability: sandbox.stub().resolves(true),
	getValidRoomName: sandbox.stub().callsFake((name: string) => Promise.resolve(name)),
	notifyOnIntegrationChangedByChannels: sandbox.stub().resolves(),
	notifyOnSubscriptionChangedByRoomId: sandbox.stub().resolves(),
	callbacks: {
		run: sandbox.stub().resolves(),
	},
	isRoomNativeFederated: sandbox.stub().returns(false),
};

const { saveRoomName } = proxyquire.noCallThru().load('./saveRoomName', {
	'@rocket.chat/core-services': { Message: mocks.Message, Room: mocks.Room },
	'@rocket.chat/core-typings': { isRoomNativeFederated: mocks.isRoomNativeFederated },
	'@rocket.chat/models': { Integrations: mocks.Integrations, Rooms: mocks.Rooms, Subscriptions: mocks.Subscriptions },
	'meteor/meteor': { Meteor: { Error: class MeteorError extends Error {} } },
	'../../../../server/lib/callbacks': { callbacks: mocks.callbacks },
	'../../../../server/lib/rooms/roomCoordinator': { roomCoordinator: mocks.roomCoordinator },
	'../../../lib/server/functions/checkUsernameAvailability': { checkUsernameAvailability: mocks.checkUsernameAvailability },
	'../../../lib/server/lib/notifyListener': {
		notifyOnIntegrationChangedByChannels: mocks.notifyOnIntegrationChangedByChannels,
		notifyOnSubscriptionChangedByRoomId: mocks.notifyOnSubscriptionChangedByRoomId,
	},
	'../../../utils/server/lib/getValidRoomName': { getValidRoomName: mocks.getValidRoomName },
});

const fakeUser = { _id: 'user1', username: 'user1' } as any;

describe('saveRoomName — sysMes unread alert behavior', () => {
	beforeEach(() => {
		sandbox.resetHistory();
		mocks.checkUsernameAvailability.resolves(true);
		mocks.isRoomNativeFederated.returns(false);
	});

	it('triggers unread alert when sysMes does not include "r"', async () => {
		mocks.Rooms.findOneById.resolves({ _id: 'room1', t: 'c', name: 'old-name', sysMes: ['uj', 'ul'] });

		await saveRoomName('room1', 'new-name', fakeUser);

		expect(mocks.Rooms.setNameById.calledOnceWith('room1', 'new-name', 'new-name')).to.be.true;
		expect(mocks.Subscriptions.updateNameAndAlertByRoomId.calledOnce).to.be.true;
		expect(mocks.Subscriptions.updateNameAndFnameByRoomId.called).to.be.false;
	});

	it('skips unread alert when sysMes includes "r"', async () => {
		mocks.Rooms.findOneById.resolves({ _id: 'room1', t: 'c', name: 'old-name', sysMes: ['uj', 'r', 'ul'] });

		await saveRoomName('room1', 'new-name', fakeUser);

		expect(mocks.Rooms.setNameById.calledOnceWith('room1', 'new-name', 'new-name')).to.be.true;
		expect(mocks.Subscriptions.updateNameAndFnameByRoomId.calledOnce).to.be.true;
		expect(mocks.Subscriptions.updateNameAndAlertByRoomId.called).to.be.false;
	});

	it('triggers unread alert when sysMes is undefined (safe fallback)', async () => {
		mocks.Rooms.findOneById.resolves({ _id: 'room1', t: 'c', name: 'old-name' });

		await saveRoomName('room1', 'new-name', fakeUser);

		expect(mocks.Rooms.setNameById.calledOnceWith('room1', 'new-name', 'new-name')).to.be.true;
		expect(mocks.Subscriptions.updateNameAndAlertByRoomId.calledOnce).to.be.true;
		expect(mocks.Subscriptions.updateNameAndFnameByRoomId.called).to.be.false;
	});

	it('does not match partial tokens like "rp" as the "r" system message type', async () => {
		mocks.Rooms.findOneById.resolves({ _id: 'room1', t: 'c', name: 'old-name', sysMes: ['rp', 'ru'] });

		await saveRoomName('room1', 'new-name', fakeUser);

		expect(mocks.Rooms.setNameById.calledOnceWith('room1', 'new-name', 'new-name')).to.be.true;
		// 'rp'/'ru' are not 'r', so alert should still fire
		expect(mocks.Subscriptions.updateNameAndAlertByRoomId.calledOnce).to.be.true;
		expect(mocks.Subscriptions.updateNameAndFnameByRoomId.called).to.be.false;
	});
});
