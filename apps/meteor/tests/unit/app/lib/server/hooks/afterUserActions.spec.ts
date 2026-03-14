import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

describe('afterUserActions hooks', () => {
	const userId = 'test-user-id';

	const stubs = {
		Subscriptions: {
			setArchivedByUserId: sinon.stub(),
			hasArchivedSubscriptionsInNonArchivedRoomsByUserId: sinon.stub(),
			unarchiveByUserIdExceptForArchivedRooms: sinon.stub(),
		},
		callbacks: {
			add: sinon.stub(),
			priority: { LOW: 1 },
		},
		notifyOnSubscriptionChangedByUserId: sinon.stub(),
	};

	let handleDeactivateUser: (user: any) => Promise<void>;
	let handleActivateUser: (user: any) => Promise<void>;

	stubs.callbacks.add.callsFake((event: string, handler: any) => {
		if (event === 'afterDeactivateUser') {
			handleDeactivateUser = handler;
		}
		if (event === 'afterActivateUser') {
			handleActivateUser = handler;
		}
	});

	proxyquire.noCallThru().load('../../../../../../app/lib/server/hooks/afterUserActions', {
		'@rocket.chat/models': { Subscriptions: stubs.Subscriptions },
		'../../../../server/lib/callbacks': { callbacks: stubs.callbacks },
		'../lib/notifyListener': { notifyOnSubscriptionChangedByUserId: stubs.notifyOnSubscriptionChangedByUserId },
	});

	afterEach(() => {
		stubs.Subscriptions.setArchivedByUserId.reset();
		stubs.Subscriptions.hasArchivedSubscriptionsInNonArchivedRoomsByUserId.reset();
		stubs.Subscriptions.unarchiveByUserIdExceptForArchivedRooms.reset();
		stubs.notifyOnSubscriptionChangedByUserId.reset();
	});

	describe('afterDeactivateUser — subscription archiving', () => {
		it('should archive all user subscriptions when user is deactivated', async () => {
			stubs.Subscriptions.setArchivedByUserId.resolves({ modifiedCount: 5 });

			await handleDeactivateUser({ _id: userId });

			expect(stubs.Subscriptions.setArchivedByUserId.calledOnceWith(userId, true)).to.be.true;
			expect(stubs.notifyOnSubscriptionChangedByUserId.calledWith(userId)).to.be.true;
		});

		it('should not notify if no subscriptions were modified', async () => {
			stubs.Subscriptions.setArchivedByUserId.resolves({ modifiedCount: 0 });

			await handleDeactivateUser({ _id: userId });

			expect(stubs.Subscriptions.setArchivedByUserId.calledOnce).to.be.true;
			expect(stubs.notifyOnSubscriptionChangedByUserId.called).to.be.false;
		});
	});

	describe('afterActivateUser — subscription unarchiving', () => {
		it('should unarchive subscriptions excluding archived rooms when user is reactivated', async () => {
			stubs.Subscriptions.hasArchivedSubscriptionsInNonArchivedRoomsByUserId.resolves(true);
			stubs.Subscriptions.unarchiveByUserIdExceptForArchivedRooms.resolves();

			await handleActivateUser({ _id: userId });

			expect(stubs.Subscriptions.hasArchivedSubscriptionsInNonArchivedRoomsByUserId.calledOnceWith(userId)).to.be.true;
			expect(stubs.Subscriptions.unarchiveByUserIdExceptForArchivedRooms.calledOnceWith(userId)).to.be.true;
			expect(stubs.notifyOnSubscriptionChangedByUserId.calledWith(userId)).to.be.true;
		});

		it('should not unarchive or notify if no archived subscriptions in non-archived rooms', async () => {
			stubs.Subscriptions.hasArchivedSubscriptionsInNonArchivedRoomsByUserId.resolves(false);

			await handleActivateUser({ _id: userId });

			expect(stubs.Subscriptions.hasArchivedSubscriptionsInNonArchivedRoomsByUserId.calledOnceWith(userId)).to.be.true;
			expect(stubs.Subscriptions.unarchiveByUserIdExceptForArchivedRooms.called).to.be.false;
			expect(stubs.notifyOnSubscriptionChangedByUserId.called).to.be.false;
		});
	});
});
