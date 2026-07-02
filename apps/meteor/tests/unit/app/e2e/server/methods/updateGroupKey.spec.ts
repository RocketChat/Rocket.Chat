import { expect } from 'chai';
import { beforeEach, describe, it, vi } from 'vitest';

const { models, notifyListener } = vi.hoisted(() => {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const sinon = require('sinon');
	return {
		models: {
			Subscriptions: {
				findOneByRoomIdAndUserId: sinon.stub(),
				setGroupE2EKey: sinon.stub(),
				setGroupE2ESuggestedKey: sinon.stub(),
			},
			Rooms: {
				removeUsersFromE2EEQueueByRoomId: sinon.stub(),
			},
		},
		notifyListener: {
			notifyOnSubscriptionChanged: sinon.stub(),
			notifyOnRoomChangedById: sinon.stub(),
			notifyOnSubscriptionChangedById: sinon.stub(),
		},
	};
});

vi.mock('@rocket.chat/models', () => models);
vi.mock('../../../../../../app/lib/server/lib/notifyListener', () => ({
	notifyOnSubscriptionChanged: notifyListener.notifyOnSubscriptionChanged,
	notifyOnRoomChangedById: notifyListener.notifyOnRoomChangedById,
	notifyOnSubscriptionChangedById: notifyListener.notifyOnSubscriptionChangedById,
}));

const { updateGroupKey } = await import('../../../../../../app/e2e/server/methods/updateGroupKey');

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
