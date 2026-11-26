import { before, describe, it, mock } from 'node:test';

import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const messageMock = { saveSystemMessage: sinon.stub().resolves() };

let performUserRemoval: any;

before(async () => {
	mock.module('@rocket.chat/apps', { exports: { Apps: {}, AppEvents: {} } });
	mock.module('@rocket.chat/core-services', { exports: { Message: messageMock, Team: {}, Room: {}, ClientSafeError: Error } });
	mock.module('../../settings', { exports: { settings: { get: sinon.stub() } } });
	mock.module('../callbacks/afterLeaveRoomCallback', { exports: { afterLeaveRoomCallback: { run: sinon.stub() } } });
	mock.module('../callbacks/beforeLeaveRoomCallback', { exports: { beforeLeaveRoomCallback: { run: sinon.stub() } } });
	mock.module('../notifyListener', { exports: { notifyOnRoomChangedById: sinon.stub(), notifyOnSubscriptionChanged: sinon.stub() } });
	({ performUserRemoval } = await import('./removeUserFromRoom'));
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
