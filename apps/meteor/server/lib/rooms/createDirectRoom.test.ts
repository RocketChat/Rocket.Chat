import { before, beforeEach, describe, it, mock } from 'node:test';

import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { ClientSafeError } from '@rocket.chat/core-services';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const settingsGet = sandbox.stub();
const callbacksRun = sandbox.stub();
const triggerEvent = sandbox.stub();
const notifyOnRoomChangedById = sandbox.stub();
const notifyOnSubscriptionChangedByRoomIdAndUserId = sandbox.stub();

const Users = { findUsersByUsernames: sandbox.stub(), find: sandbox.stub() };
const Rooms = { findOneDirectRoomContainingAllUserIDs: sandbox.stub(), insertOne: sandbox.stub(), findOneById: sandbox.stub() };
const Subscriptions = { updateOne: sandbox.stub() };

const AppEvents = {
	IPreRoomCreatePrevent: 'IPreRoomCreatePrevent',
	IPreRoomCreateExtend: 'IPreRoomCreateExtend',
	IPreRoomCreateModify: 'IPreRoomCreateModify',
	IPostRoomCreate: 'IPostRoomCreate',
};

let createDirectRoom: any;

before(async () => {
	mock.module('@rocket.chat/apps', { exports: { Apps: { self: { triggerEvent } }, AppEvents } });
	mock.module('@rocket.chat/core-services', { exports: { ClientSafeError } });
	mock.module('../../settings', { exports: { settings: { get: settingsGet } } });
	mock.module('../callbacks', { exports: { callbacks: { run: callbacksRun } } });
	mock.module('../notifyListener', { exports: { notifyOnRoomChangedById, notifyOnSubscriptionChangedByRoomIdAndUserId } });
	({ createDirectRoom } = await import('./createDirectRoom'));
});

const alice = { _id: 'u2', username: 'alice', name: 'Alice' };
const bob = { _id: 'u1', username: 'bob', name: 'Bob' };
const carol = { _id: 'u3', username: 'carol', name: 'Carol' };

describe('createDirectRoom', () => {
	beforeEach(() => {
		sandbox.reset();
		mockModel('Users', Users);
		mockModel('Rooms', Rooms);
		mockModel('Subscriptions', Subscriptions);

		settingsGet.withArgs('DirectMesssage_maxUsers').returns(8);
		Users.findUsersByUsernames.returns({ toArray: async () => [{ ...bob }, { ...alice }] });
		Users.find.returns({ toArray: async () => [{ ...bob }, { ...alice }] });
		Rooms.findOneDirectRoomContainingAllUserIDs.resolves(null);
		Rooms.insertOne.resolves({ insertedId: 'rid1' });
		Rooms.findOneById.resolves({ _id: 'rid1', t: 'd' });
		Subscriptions.updateOne.resolves({ modifiedCount: 0, upsertedCount: 1 });
		triggerEvent.resolves(undefined);
	});

	it('throws when there are more members than DirectMesssage_maxUsers allows', async () => {
		settingsGet.withArgs('DirectMesssage_maxUsers').returns(2);

		const error = await createDirectRoom(['alice', 'bob', 'carol'], {}, {}).catch((e: unknown) => e);

		expect(error).to.be.instanceOf(ClientSafeError);
		expect(error).to.include({
			error: 'error-direct-message-max-user-exceeded',
			reason: 'You cannot add more than 2 users, including yourself to a direct message',
		});
		expect(callbacksRun.called).to.be.false;
	});

	it('uses a default maximum of one when DirectMesssage_maxUsers is not set', async () => {
		settingsGet.withArgs('DirectMesssage_maxUsers').returns(undefined);

		const error = await createDirectRoom(['alice', 'bob'], {}, {}).catch((e: unknown) => e);

		expect(error).to.include({ error: 'error-direct-message-max-user-exceeded' });
	});

	it('runs beforeCreateDirectRoom with the usernames of string and user members, skipping members without one', async () => {
		const extraData = { topic: 'hi' };

		await createDirectRoom(['alice', bob, { _id: 'nousername' }], extraData, {});

		expect(callbacksRun.firstCall.args).to.deep.equal(['beforeCreateDirectRoom', ['alice', 'bob'], extraData]);
		expect(callbacksRun.firstCall.calledBefore(Users.findUsersByUsernames.firstCall)).to.be.true;
		expect(Users.findUsersByUsernames.firstCall.args[0]).to.deep.equal(['alice', 'bob']);
	});

	it('looks up an existing room by the sorted user ids', async () => {
		await createDirectRoom(['bob', 'alice'], {}, {});

		expect(Rooms.findOneDirectRoomContainingAllUserIDs.firstCall.args[0]).to.deep.equal(['u1', 'u2']);
	});

	it('inserts a new room with usernames sorted by display name and the extra data', async () => {
		await createDirectRoom(['bob', 'alice'], { topic: 'hi' }, {});

		const inserted = Rooms.insertOne.firstCall.args[0];
		expect(inserted).to.deep.include({
			t: 'd',
			usernames: ['alice', 'bob'],
			usersCount: 2,
			msgs: 0,
			uids: ['u1', 'u2'],
			topic: 'hi',
		});
		expect(inserted.ts).to.be.instanceOf(Date);
		expect(inserted).to.not.have.property('ro');
		expect(inserted).to.not.have.property('_USERNAMES');
	});

	it('marks a new 1-on-1 room read-only when one member is deactivated', async () => {
		Users.findUsersByUsernames.returns({ toArray: async () => [{ ...bob, active: false }, { ...alice }] });

		await createDirectRoom(['bob', 'alice'], {}, {});

		expect(Rooms.insertOne.firstCall.args[0]).to.deep.include({ ro: true, reactWhenReadOnly: false });
	});

	it('does not mark a group DM read-only when one member is deactivated', async () => {
		Users.findUsersByUsernames.returns({ toArray: async () => [{ ...bob, active: false }, { ...alice }, { ...carol }] });
		Users.find.returns({ toArray: async () => [{ ...bob }, { ...alice }, { ...carol }] });

		await createDirectRoom(['bob', 'alice', 'carol'], {}, {});

		expect(Rooms.insertOne.firstCall.args[0]).to.not.have.property('ro');
	});

	it('triggers the prevent, extend and modify app events in order with the room and its usernames', async () => {
		const seen: unknown[] = [];
		triggerEvent.callsFake(async (event: string, room: Record<string, unknown>) => {
			seen.push([event, room && { ...room }]);
			return event === AppEvents.IPreRoomCreateExtend ? { extended: true } : undefined;
		});

		await createDirectRoom(['bob', 'alice'], {}, {});

		expect(seen.map(([event]: any) => event)).to.deep.equal([
			'IPreRoomCreatePrevent',
			'IPreRoomCreateExtend',
			'IPreRoomCreateModify',
			'IPostRoomCreate',
		]);
		expect((seen[0] as any)[1]).to.deep.include({ t: 'd', usernames: ['alice', 'bob'], _USERNAMES: ['alice', 'bob'] });
		expect((seen[1] as any)[1]).to.deep.include({ _USERNAMES: ['alice', 'bob'] });
		expect(triggerEvent.thirdCall.args[1]).to.deep.equal({ extended: true });
		expect(triggerEvent.thirdCall.calledBefore(Rooms.insertOne.firstCall)).to.be.true;
	});

	it('merges the object returned by the modify app event into the inserted room', async () => {
		triggerEvent.withArgs(AppEvents.IPreRoomCreateModify).resolves({ topic: 'from app' });

		await createDirectRoom(['bob', 'alice'], { topic: 'original' }, {});

		expect(Rooms.insertOne.firstCall.args[0]).to.deep.include({ topic: 'from app' });
	});

	it('ignores a non-object result of the modify app event', async () => {
		triggerEvent.withArgs(AppEvents.IPreRoomCreateModify).resolves(true);

		await createDirectRoom(['bob', 'alice'], { topic: 'original' }, {});

		expect(Rooms.insertOne.firstCall.args[0]).to.deep.include({ topic: 'original' });
	});

	it('throws error-app-prevented when an app prevents the room creation', async () => {
		triggerEvent.withArgs(AppEvents.IPreRoomCreatePrevent).resolves(true);

		const error = await createDirectRoom(['bob', 'alice'], {}, {}).catch((e: unknown) => e);

		expect(error).to.be.instanceOf(ClientSafeError);
		expect(error).to.include({ error: 'error-app-prevented', reason: 'A Rocket.Chat App prevented the room creation.' });
		expect(Rooms.insertOne.called).to.be.false;
	});

	it('turns an AppsEngineException from the prevent event into error-app-prevented with its message', async () => {
		triggerEvent.withArgs(AppEvents.IPreRoomCreatePrevent).rejects(new AppsEngineException('blocked by app'));

		const error = await createDirectRoom(['bob', 'alice'], {}, {}).catch((e: unknown) => e);

		expect(error).to.be.instanceOf(ClientSafeError);
		expect(error).to.include({ error: 'error-app-prevented', reason: 'blocked by app' });
		expect(Rooms.insertOne.called).to.be.false;
	});

	it('rethrows any other error from the prevent event', async () => {
		const failure = new Error('app crashed');
		triggerEvent.withArgs(AppEvents.IPreRoomCreatePrevent).rejects(failure);

		const error = await createDirectRoom(['bob', 'alice'], {}, {}).catch((e: unknown) => e);

		expect(error).to.equal(failure);
		expect(Rooms.insertOne.called).to.be.false;
	});

	it('notifies the inserted room, runs afterCreateDirectRoom with the inserted room and triggers IPostRoomCreate', async () => {
		const insertedRoom = { _id: 'rid1', t: 'd', usernames: ['alice', 'bob'] };
		Rooms.findOneById.resolves(insertedRoom);

		await createDirectRoom(['bob', 'alice'], {}, { creator: 'u1' });

		expect(notifyOnRoomChangedById.firstCall.args).to.deep.equal(['rid1', 'inserted']);
		expect(Rooms.findOneById.firstCall.args[0]).to.equal('rid1');
		const afterCall = callbacksRun.getCalls().find((call) => call.args[0] === 'afterCreateDirectRoom');
		expect(afterCall?.args[1]).to.equal(insertedRoom);
		expect(afterCall?.args[2].creatorId).to.equal('u1');
		expect(afterCall?.args[2].members.map(({ _id }: { _id: string }) => _id)).to.deep.equal(['u2', 'u1']);
		expect(afterCall?.calledAfter(Subscriptions.updateOne.lastCall)).to.be.true;
		expect(triggerEvent.lastCall.args).to.deep.equal(['IPostRoomCreate', insertedRoom]);
	});

	it('returns the created room', async () => {
		const result = await createDirectRoom(['bob', 'alice'], {}, {});

		expect(result).to.deep.equal({ _id: 'rid1', usernames: ['alice', 'bob'], t: 'd', rid: 'rid1', inserted: true });
	});

	it('reuses an existing room without app events, insertion or after-create hooks', async () => {
		Rooms.findOneDirectRoomContainingAllUserIDs.resolves({ _id: 'existing', t: 'd', fname: 'old', usernames: ['x'] });
		Subscriptions.updateOne.resolves({ modifiedCount: 1, upsertedCount: 0 });

		const result = await createDirectRoom(['bob', 'alice'], {}, {});

		expect(triggerEvent.called).to.be.false;
		expect(Rooms.insertOne.called).to.be.false;
		expect(Rooms.findOneById.called).to.be.false;
		expect(callbacksRun.calledWith('afterCreateDirectRoom')).to.be.false;
		expect(notifyOnRoomChangedById.firstCall.args).to.deep.equal(['existing', 'updated']);
		expect(Subscriptions.updateOne.firstCall.args[0]).to.deep.equal({ 'rid': 'existing', 'u._id': 'u1' });
		expect(notifyOnSubscriptionChangedByRoomIdAndUserId.firstCall.args).to.deep.equal(['existing', 'u1', 'updated']);
		expect(result).to.deep.equal({ _id: 'existing', t: 'd', fname: 'old', usernames: ['alice', 'bob'], rid: 'existing', inserted: false });
	});

	it('skips the existing room lookup when forceNew is set', async () => {
		await createDirectRoom(['bob', 'alice'], {}, { forceNew: true });

		expect(Rooms.findOneDirectRoomContainingAllUserIDs.called).to.be.false;
		expect(Rooms.insertOne.calledOnce).to.be.true;
	});

	describe('DM to yourself', () => {
		beforeEach(() => {
			Users.findUsersByUsernames.returns({
				toArray: async () => [{ ...alice, customFields: { team: 'a' }, settings: { preferences: { desktopNotifications: 'all' } } }],
			});
		});

		it('upserts one open subscription named after the user', async () => {
			await createDirectRoom(['alice'], {}, { subscriptionExtra: { open: false, prid: 'parent' } });

			expect(Users.find.called).to.be.false;
			expect(Subscriptions.updateOne.calledOnce).to.be.true;
			const [filter, update, options] = Subscriptions.updateOne.firstCall.args;
			expect(filter).to.deep.equal({ 'rid': 'rid1', 'u._id': 'u2' });
			expect(options).to.deep.equal({ upsert: true });
			expect(update.$set).to.deep.equal({ open: true });
			expect(update.$setOnInsert).to.deep.include({
				alert: false,
				unread: 0,
				userMentions: 0,
				groupMentions: 0,
				customFields: { team: 'a' },
				desktopNotifications: 'all',
				desktopPrefOrigin: 'user',
				open: false,
				prid: 'parent',
				t: 'd',
				fname: 'Alice',
				name: 'alice',
				u: { _id: 'u2', username: 'alice' },
			});
			expect(update.$setOnInsert._id).to.be.a('string');
			expect(update.$setOnInsert.ts).to.be.instanceOf(Date);
		});

		it('uses the username as fname when the user has no name', async () => {
			Users.findUsersByUsernames.returns({ toArray: async () => [{ _id: 'u2', username: 'alice' }] });

			await createDirectRoom(['alice'], {}, {});

			expect(Subscriptions.updateOne.firstCall.args[1].$setOnInsert).to.deep.include({ fname: 'alice', name: 'alice' });
		});

		it('notifies the subscription as inserted when it was upserted', async () => {
			await createDirectRoom(['alice'], {}, {});

			expect(notifyOnSubscriptionChangedByRoomIdAndUserId.firstCall.args).to.deep.equal(['rid1', 'u2', 'inserted']);
		});

		it('notifies the subscription as updated when it was modified', async () => {
			Subscriptions.updateOne.resolves({ modifiedCount: 1, upsertedCount: 0 });

			await createDirectRoom(['alice'], {}, {});

			expect(notifyOnSubscriptionChangedByRoomIdAndUserId.firstCall.args).to.deep.equal(['rid1', 'u2', 'updated']);
		});

		it('does not notify the subscription when nothing changed', async () => {
			Subscriptions.updateOne.resolves({ modifiedCount: 0, upsertedCount: 0 });

			await createDirectRoom(['alice'], {}, {});

			expect(notifyOnSubscriptionChangedByRoomIdAndUserId.called).to.be.false;
		});
	});

	describe('DM between several members', () => {
		it('reads the members preferences by id', async () => {
			await createDirectRoom(['bob', 'alice'], {}, {});

			expect(Users.find.firstCall.args).to.deep.equal([
				{ _id: { $in: ['u2', 'u1'] } },
				{ projection: { 'username': 1, 'settings.preferences': 1 } },
			]);
		});

		it('opens the subscription of the creator and leaves the other one closed in a 1-on-1', async () => {
			await createDirectRoom(['bob', 'alice'], {}, { creator: 'u1', subscriptionExtra: { prid: 'parent' } });

			const [bobCall, aliceCall] = Subscriptions.updateOne.getCalls();
			expect(bobCall.args[0]).to.deep.equal({ 'rid': 'rid1', 'u._id': 'u1' });
			expect(bobCall.args[1].$set).to.deep.equal({ open: true });
			expect(bobCall.args[1].$setOnInsert).to.not.have.property('open');
			expect(bobCall.args[1].$setOnInsert).to.deep.include({
				prid: 'parent',
				fname: 'Alice',
				name: 'alice',
				u: { _id: 'u1', username: 'bob' },
			});
			expect(bobCall.args[2]).to.deep.equal({ upsert: true });

			expect(aliceCall.args[0]).to.deep.equal({ 'rid': 'rid1', 'u._id': 'u2' });
			expect(aliceCall.args[1]).to.not.have.property('$set');
			expect(aliceCall.args[1].$setOnInsert).to.deep.include({
				open: false,
				prid: 'parent',
				fname: 'Bob',
				name: 'bob',
				u: { _id: 'u2', username: 'alice' },
			});
			expect(aliceCall.args[1].$setOnInsert).to.not.have.property('status');
			expect(aliceCall.args[1].$setOnInsert).to.not.have.property('roles');
		});

		it('opens the subscriptions of the other members of a group DM', async () => {
			Users.findUsersByUsernames.returns({ toArray: async () => [{ ...bob }, { ...alice }, { ...carol }] });
			Users.find.returns({ toArray: async () => [{ ...alice }, { ...carol }] });

			await createDirectRoom(['bob', 'alice', 'carol'], {}, { creator: 'u1' });

			const [aliceCall, carolCall] = Subscriptions.updateOne.getCalls();
			expect(aliceCall.args[1].$setOnInsert).to.deep.include({ open: true, fname: 'Bob, Carol', name: 'bob, carol' });
			expect(carolCall.args[1].$setOnInsert).to.deep.include({ open: true, fname: 'Alice, Bob', name: 'alice, bob' });
		});

		it('lets subscriptionExtra override the computed open flag', async () => {
			await createDirectRoom(['bob', 'alice'], {}, { creator: 'u1', subscriptionExtra: { open: true } });

			expect(Subscriptions.updateOne.secondCall.args[1].$setOnInsert).to.deep.include({ open: true });
		});

		it('notifies each changed subscription', async () => {
			Subscriptions.updateOne.onFirstCall().resolves({ modifiedCount: 1, upsertedCount: 0 });
			Subscriptions.updateOne.onSecondCall().resolves({ modifiedCount: 0, upsertedCount: 0 });

			await createDirectRoom(['bob', 'alice'], {}, {});

			expect(notifyOnSubscriptionChangedByRoomIdAndUserId.calledOnce).to.be.true;
			expect(notifyOnSubscriptionChangedByRoomIdAndUserId.firstCall.args).to.deep.equal(['rid1', 'u1', 'updated']);
		});

		it('throws error-creator-not-in-room for a federated DM whose creator is not a member', async () => {
			const error = await createDirectRoom(['bob', 'alice'], { federated: true }, { creator: 'stranger' }).catch((e: unknown) => e);

			expect(error).to.be.instanceOf(ClientSafeError);
			expect(error).to.include({ error: 'error-creator-not-in-room', reason: 'The creator user must be part of the direct room' });
			expect(Rooms.insertOne.calledOnce).to.be.true;
			expect(Subscriptions.updateOne.called).to.be.false;
			expect(callbacksRun.calledWith('afterCreateDirectRoom')).to.be.false;
		});

		it('makes the creator owner and invites the other members of a federated DM', async () => {
			await createDirectRoom(['bob', 'alice'], { federated: true }, { creator: 'u1' });

			const [bobCall, aliceCall] = Subscriptions.updateOne.getCalls();
			expect(bobCall.args[1].$set).to.deep.equal({ open: true });
			expect(bobCall.args[1].$setOnInsert).to.deep.include({ roles: ['owner'] });
			expect(bobCall.args[1].$setOnInsert).to.not.have.property('status');

			expect(aliceCall.args[1].$setOnInsert).to.deep.include({
				status: 'INVITED',
				inviter: { _id: 'u1', username: 'bob', name: 'Bob' },
				open: true,
				unread: 1,
				userMentions: 1,
			});
			expect(aliceCall.args[1].$setOnInsert).to.not.have.property('roles');
		});
	});
});
