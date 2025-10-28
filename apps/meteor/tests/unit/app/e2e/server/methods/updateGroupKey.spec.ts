import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const models = {
	Subscriptions: {
		findOneByRoomIdAndUserId: sinon.stub(),
		setGroupE2EKey: sinon.stub(),
		setGroupE2ESuggestedKey: sinon.stub(),
	},
	Rooms: {
		removeUsersFromE2EEQueueByRoomId: sinon.stub(),
	},
};

const { updateGroupKey } = proxyquire.noCallThru().load('../../../../../../app/e2e/server/methods/updateGroupKey.ts', {
	'../../../lib/server/lib/notifyListener': {
		notifyOnSubscriptionChanged: sinon.stub(),
		notifyOnRoomChangedById: sinon.stub(),
		notifyOnSubscriptionChangedById: sinon.stub(),
	},
	'../../../lib/server/lib/deprecationWarningLogger': {
		methodDeprecationLogger: {
			method: sinon.stub(),
		},
	},
	'@rocket.chat/models': models,
	'meteor/meteor': { Meteor: { methods: sinon.stub() } },
});

describe('updateGroupKey', () => {
	beforeEach(() => {
		models.Subscriptions.findOneByRoomIdAndUserId.reset();
		models.Subscriptions.setGroupE2EKey.reset();
		models.Subscriptions.setGroupE2ESuggestedKey.reset();
	});

	it('should do nothing if user has no subscription', async () => {
		models.Subscriptions.findOneByRoomIdAndUserId.resolves(null);
		const res = await updateGroupKey('rid', 'uid', 'key', 'callerUserId');

		expect(res).to.be.undefined;
	});
	it('should suggest the key to the user when uid is different from callerUserId', async () => {
		models.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'subscriptionId' });
		models.Subscriptions.setGroupE2ESuggestedKey.resolves({ value: {} });
		const res = await updateGroupKey('rid', 'uid', 'key', 'callerUserId');

		expect(res).to.be.undefined;
		expect(models.Subscriptions.setGroupE2ESuggestedKey.calledOnce).to.be.true;
	});
	it('should set the group key when uid is the callerUserId', async () => {
		models.Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'subscriptionId' });
		models.Subscriptions.setGroupE2EKey.resolves({ modifiedCount: 1 });
		models.Rooms.removeUsersFromE2EEQueueByRoomId.resolves({ modifiedCount: 1 });
		const res = await updateGroupKey('rid', 'uid', 'key', 'uid');

		expect(res).to.be.undefined;
		expect(models.Subscriptions.setGroupE2EKey.calledOnce).to.be.true;
		expect(models.Rooms.removeUsersFromE2EEQueueByRoomId.calledOnce).to.be.true;
	});
});
