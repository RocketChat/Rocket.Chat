import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import proxyquire from 'proxyquire';
import Sinon from 'sinon';

const RoomsStub = {
	countGroupDMsByUids: Sinon.stub(),
	findGroupDMsByUids: Sinon.stub(),
};

const UsersStub = {
	findByIds: Sinon.stub(),
};

const SubscriptionsStub = {
	findByRoomId: Sinon.stub(),
	updateNameAndFnameById: Sinon.stub(),
};

const notifyOnSubscriptionChangedByRoomIdStub = Sinon.stub();

const { updateGroupDMsName } = proxyquire.noCallThru().load('../../../../../server/lib/rooms/updateGroupDMsName.ts', {
	'@rocket.chat/models': {
		Rooms: RoomsStub,
		Users: UsersStub,
		Subscriptions: SubscriptionsStub,
	},
	'../notifyListener': {
		notifyOnSubscriptionChangedByRoomId: notifyOnSubscriptionChangedByRoomIdStub,
	},
});

const cursorOf = (docs: unknown[]) => ({
	toArray: async () => docs,
	forEach: async (fn: (doc: any) => Promise<void> | void) => {
		for (const doc of docs) {
			await fn(doc);
		}
	},
	[Symbol.asyncIterator]: async function* () {
		for (const doc of docs) {
			yield doc;
		}
	},
});

describe('updateGroupDMsName', () => {
	beforeEach(() => {
		Sinon.reset();
	});

	it('should return early if the user has no username', async () => {
		await updateGroupDMsName({ _id: 'u1', username: undefined, name: 'User 1' });
		expect(RoomsStub.countGroupDMsByUids.called).to.be.false;
	});

	it('should return early if the user is in no group DMs', async () => {
		RoomsStub.countGroupDMsByUids.resolves(0);

		await updateGroupDMsName({ _id: 'u1', username: 'user1', name: 'User 1' });

		expect(RoomsStub.countGroupDMsByUids.calledOnceWith(['u1'])).to.be.true;
		expect(RoomsStub.findGroupDMsByUids.called).to.be.false;
	});

	it('should update subscriptions for group DMs with 3 or more members', async () => {
		RoomsStub.countGroupDMsByUids.resolves(1);
		RoomsStub.findGroupDMsByUids
			.onFirstCall()
			.returns(cursorOf([{ _id: 'room1', uids: ['u1', 'u2', 'u3'] }]))
			.onSecondCall()
			.returns(cursorOf([{ _id: 'room1', uids: ['u1', 'u2', 'u3'] }]));

		UsersStub.findByIds.returns(
			cursorOf([
				{ _id: 'u2', username: 'user2', name: 'User Two' },
				{ _id: 'u3', username: 'user3', name: 'User Three' },
			]),
		);

		SubscriptionsStub.findByRoomId.returns(
			cursorOf([
				{ _id: 'sub1', u: { _id: 'u1' } },
				{ _id: 'sub2', u: { _id: 'u2' } },
				{ _id: 'sub3', u: { _id: 'u3' } },
			]),
		);

		SubscriptionsStub.updateNameAndFnameById.resolves({ modifiedCount: 1 });

		await updateGroupDMsName({ _id: 'u1', username: 'user1', name: 'User One Updated' });

		expect(SubscriptionsStub.updateNameAndFnameById.callCount).to.equal(3);
		expect(SubscriptionsStub.updateNameAndFnameById.firstCall.args).to.deep.equal([
			'sub1',
			'user3,user2',
			'User Three, User Two',
			{ session: undefined },
		]);
		expect(notifyOnSubscriptionChangedByRoomIdStub.calledWith('room1')).to.be.true;
	});

	it('should skip rooms with fewer than 3 members to prevent duplicate key collisions', async () => {
		RoomsStub.countGroupDMsByUids.resolves(1);
		RoomsStub.findGroupDMsByUids
			.onFirstCall()
			.returns(cursorOf([{ _id: 'shrunkRoom', uids: ['u1', 'u2'] }]))
			.onSecondCall()
			.returns(cursorOf([{ _id: 'shrunkRoom', uids: ['u1', 'u2'] }]));

		UsersStub.findByIds.returns(
			cursorOf([
				{ _id: 'u2', username: 'user2', name: 'User Two' },
			]),
		);

		await updateGroupDMsName({ _id: 'u1', username: 'user1', name: 'User One Updated' });

		expect(SubscriptionsStub.findByRoomId.called).to.be.false;
		expect(SubscriptionsStub.updateNameAndFnameById.called).to.be.false;
	});

	it('should skip rooms without uids without breaking loop execution for other rooms', async () => {
		RoomsStub.countGroupDMsByUids.resolves(1);
		RoomsStub.findGroupDMsByUids
			.onFirstCall()
			.returns(cursorOf([{ _id: 'roomWithNoUids' }, { _id: 'validRoom', uids: ['u1', 'u2', 'u3'] }]))
			.onSecondCall()
			.returns(cursorOf([{ _id: 'roomWithNoUids' }, { _id: 'validRoom', uids: ['u1', 'u2', 'u3'] }]));

		UsersStub.findByIds.returns(
			cursorOf([
				{ _id: 'u2', username: 'user2', name: 'User Two' },
				{ _id: 'u3', username: 'user3', name: 'User Three' },
			]),
		);

		SubscriptionsStub.findByRoomId.returns(
			cursorOf([
				{ _id: 'sub1', u: { _id: 'u1' } },
			]),
		);

		SubscriptionsStub.updateNameAndFnameById.resolves({ modifiedCount: 1 });

		await updateGroupDMsName({ _id: 'u1', username: 'user1', name: 'User One Updated' });

		expect(SubscriptionsStub.findByRoomId.calledOnceWith('validRoom')).to.be.true;
	});
});
