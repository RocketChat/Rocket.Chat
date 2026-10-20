import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();
const alice = { _id: 'alice-id', username: 'alice' };
const bob = { _id: 'bob-id', username: 'bob' };
const carol = { _id: 'carol-id', username: 'carol' };
const users = [alice, bob, carol];
const Rooms = {
	findOneDirectRoomContainingAllUserIDs: sandbox.stub(),
	insertOne: sandbox.stub(),
	findOneById: sandbox.stub(),
};
const Subscriptions = { updateOne: sandbox.stub() };
const Users = { findUsersByUsernames: sandbox.stub(), find: sandbox.stub() };

const { createDirectRoom } = proxyquire.noCallThru().load('../../../../../server/lib/rooms/createDirectRoom', {
	'@rocket.chat/apps': { Apps: {}, AppEvents: {} },
	'@rocket.chat/apps-engine/definition/exceptions': { AppsEngineException: Error },
	'@rocket.chat/models': { Rooms, Subscriptions, Users },
	'@rocket.chat/random': { Random: { id: () => 'subscription-id' } },
	'@rocket.chat/tools': { isTruthy: Boolean },
	'meteor/meteor': { Meteor: { Error } },
	'../../settings': { settings: { get: () => 8 } },
	'../callbacks': { callbacks: { run: sandbox.stub().resolves() } },
	'../notifyListener': {
		notifyOnRoomChangedById: sandbox.stub(),
		notifyOnSubscriptionChangedByRoomIdAndUserId: sandbox.stub(),
	},
	'../utils/lib/getDefaultSubscriptionPref': { getDefaultSubscriptionPref: () => ({}) },
});

describe('createDirectRoom', () => {
	beforeEach(() => {
		sandbox.reset();
		Rooms.findOneDirectRoomContainingAllUserIDs.resolves(null);
		Rooms.insertOne.resolves({ insertedId: 'room-id' });
		Rooms.findOneById.resolves({ _id: 'room-id' });
		Subscriptions.updateOne.resolves({ modifiedCount: 0, upsertedCount: 1 });
		Users.findUsersByUsernames.callsFake((usernames: string[]) => ({
			toArray: async () => users.filter((user) => usernames.includes(user.username)),
		}));
		Users.find.callsFake((query: { _id: { $in: string[] } }) => ({
			toArray: async () => users.filter((user) => query._id.$in.includes(user._id)),
		}));
	});

	it('should count a repeated recipient only once in a one-to-one DM', async () => {
		await createDirectRoom([alice, bob, bob], {}, { creator: alice._id });

		expect(Rooms.insertOne.firstCall.args[0]).to.include({ usersCount: 2 });
		expect(Rooms.insertOne.firstCall.args[0].uids).to.deep.equal([alice._id, bob._id]);
		const recipientSubscription = Subscriptions.updateOne.getCalls().find((call) => call.args[0]['u._id'] === bob._id);
		expect(recipientSubscription?.args[1].$setOnInsert.open).to.be.false;
	});

	it('should count repeated usernames only once in a group DM', async () => {
		await createDirectRoom(['alice', 'bob', 'carol', 'bob'], {}, { creator: alice._id });

		expect(Rooms.insertOne.firstCall.args[0]).to.include({ usersCount: 3 });
		expect(Rooms.insertOne.firstCall.args[0].uids).to.deep.equal(users.map(({ _id }) => _id));
		expect(Subscriptions.updateOne.callCount).to.equal(3);
		const recipientSubscription = Subscriptions.updateOne.getCalls().find((call) => call.args[0]['u._id'] === bob._id);
		expect(recipientSubscription?.args[1].$setOnInsert.open).to.be.true;
	});

	it('should count repeated members only once in a self-DM', async () => {
		await createDirectRoom([alice, alice], {}, { creator: alice._id });

		expect(Rooms.insertOne.firstCall.args[0]).to.include({ usersCount: 1 });
		expect(Subscriptions.updateOne.callCount).to.equal(1);
	});

	it('should preserve the member count and subscriptions for distinct members', async () => {
		await createDirectRoom(users, {}, { creator: alice._id });

		expect(Rooms.insertOne.firstCall.args[0]).to.include({ usersCount: 3 });
		expect(Subscriptions.updateOne.callCount).to.equal(3);
	});
});
