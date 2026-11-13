import { before, describe, it } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import p from 'proxyquire';
import sinon from 'sinon';

const messageMock = { saveSystemMessage: sinon.stub().resolves() };

const { performUserRemoval } = p.noCallThru().load('./removeUserFromRoom.ts', {
	'@rocket.chat/apps': { Apps: {}, AppEvents: {} },
	'@rocket.chat/core-services': { Message: messageMock, Team: {}, Room: {}, ClientSafeError: Error },
	'../../settings': { settings: { get: sinon.stub() } },
	'../callbacks/afterLeaveRoomCallback': { afterLeaveRoomCallback: { run: sinon.stub() } },
	'../callbacks/beforeLeaveRoomCallback': { beforeLeaveRoomCallback: { run: sinon.stub() } },
	'../notifyListener': { notifyOnRoomChangedById: sinon.stub(), notifyOnSubscriptionChanged: sinon.stub() },
});

describe('performUserRemoval', () => {
	before(() => {
		mockModel('Subscriptions', {
			findOneByRoomIdAndUserId: sinon.stub().resolves({ _id: 'sub1' }),
			removeByRoomIdAndUserId: sinon.stub().resolves(null),
		});
		mockModel('Rooms', {});
	});

	it('should save the user who removed the member as the message author', async () => {
		const byUser = { _id: 'admin1', username: 'admin' };

		await performUserRemoval({ _id: 'room1', t: 'c', teamMain: true }, { _id: 'user1', username: 'removed' }, { byUser });

		const { args } = messageMock.saveSystemMessage.firstCall;
		expect(args[0]).to.equal('removed-user-from-team');
		expect(args[2]).to.equal('removed');
		expect(args[3]).to.equal(byUser);
		expect(args[4]).to.be.undefined;
	});
});
