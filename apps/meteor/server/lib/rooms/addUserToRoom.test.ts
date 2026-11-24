import { before, beforeEach, describe, it, mock } from 'node:test';

import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { ClientSafeError, isClientSafeError } from '@rocket.chat/core-services';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

class AbacContractError extends Error {}

const sandbox = sinon.createSandbox();

const triggerEvent = sandbox.stub();
const Message = { saveSystemMessage: sandbox.stub() };
const Team = { addMember: sandbox.stub() };
const Room = { createUserSubscription: sandbox.stub() };
const allowMemberAction = sandbox.stub();
const getRoomDirectives = sandbox.stub();
const beforeAddUserToRoomPatch = sandbox.stub();
const beforeAddUserToRoom = { run: sandbox.stub() };
const settingsGet = sandbox.stub();
const callbacksRun = sandbox.stub();
const notifyOnRoomChangedById = sandbox.stub();
const notifyOnSubscriptionChanged = sandbox.stub();

const Rooms = { findOneById: sandbox.stub(), addUserIdToE2EEQueueByRoomIds: sandbox.stub() };
const Users = { findOneById: sandbox.stub() };
const Subscriptions = { findOneByRoomIdAndUserId: sandbox.stub(), removeByRoomIdAndUserId: sandbox.stub() };

const AppEvents = { IPreRoomUserJoined: 'IPreRoomUserJoined', IPostRoomUserJoined: 'IPostRoomUserJoined' };

let addUserToRoom: any;

before(async () => {
	const moduleMocks = [
		mock.module('@rocket.chat/abac', { exports: { AbacContractError } }),
		mock.module('@rocket.chat/apps', { exports: { Apps: { self: { triggerEvent } }, AppEvents } }),
		mock.module('@rocket.chat/core-services', { exports: { Message, Team, Room, ClientSafeError, isClientSafeError } }),
		mock.module('./roomCoordinator', { exports: { roomCoordinator: { getRoomDirectives } } }),
		mock.module('../../hooks/rooms/beforeAddUserToRoom', { exports: { beforeAddUserToRoom: beforeAddUserToRoomPatch } }),
		mock.module('../../settings', { exports: { settings: { get: settingsGet } } }),
		mock.module('../callbacks', { exports: { callbacks: { run: callbacksRun } } }),
		mock.module('../callbacks/beforeAddUserToRoom', { exports: { beforeAddUserToRoom } }),
		mock.module('../notifyListener', { exports: { notifyOnRoomChangedById, notifyOnSubscriptionChanged } }),
	];
	({ addUserToRoom } = await import('./addUserToRoom'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

const room = { _id: 'rid1', t: 'c' };
const user = { _id: 'u1', username: 'alice' };
const inviter = { _id: 'inv1', username: 'boss' };
const inviterDoc = { _id: 'inv1', username: 'boss', name: 'Boss' };

const nextMacrotask = () => new Promise((resolve) => setImmediate(resolve));

describe('addUserToRoom', () => {
	beforeEach(() => {
		sandbox.reset();
		mockModel('Rooms', Rooms);
		mockModel('Users', Users);
		mockModel('Subscriptions', Subscriptions);

		Rooms.findOneById.resolves(room);
		Users.findOneById.withArgs('u1').resolves(user);
		Users.findOneById.withArgs('inv1').resolves(inviterDoc);
		getRoomDirectives.returns({ allowMemberAction });
		allowMemberAction.resolves(true);
		Subscriptions.findOneByRoomIdAndUserId.resolves(null);
		triggerEvent.resolves(undefined);
	});

	it('throws error-invalid-room when the room does not exist', async () => {
		Rooms.findOneById.resolves(null);

		const error = await addUserToRoom('rid1', user).catch((e: unknown) => e);

		expect(error).to.be.instanceOf(ClientSafeError);
		expect(error).to.include({ error: 'error-invalid-room' });
		expect(Users.findOneById.called).to.be.false;
	});

	it('throws user-not-found when the user does not exist', async () => {
		Users.findOneById.withArgs('u1').resolves(null);

		const error = await addUserToRoom('rid1', user).catch((e: unknown) => e);

		expect(error).to.include({ error: 'user-not-found' });
		expect(getRoomDirectives.firstCall.args[0]).to.equal('c');
	});

	it('returns undefined without running hooks when the user may neither join nor be invited', async () => {
		allowMemberAction.resolves(false);

		const result = await addUserToRoom('rid1', user, inviter);

		expect(result).to.be.undefined;
		expect(allowMemberAction.getCalls().map((call) => call.args)).to.deep.equal([
			[room, 'join', 'u1'],
			[room, 'invite', 'u1'],
		]);
		expect(beforeAddUserToRoomPatch.called).to.be.false;
		expect(Room.createUserSubscription.called).to.be.false;
	});

	it('proceeds when the user may only be invited', async () => {
		allowMemberAction.withArgs(room, 'join').resolves(false);

		const result = await addUserToRoom('rid1', user);

		expect(result).to.be.true;
		expect(Room.createUserSubscription.calledOnce).to.be.true;
	});

	describe('before-add hooks', () => {
		it('runs the patch and the callback with the inviter document, then beforeAddedToRoom with the given inviter', async () => {
			await addUserToRoom('rid1', user, inviter);

			expect(Users.findOneById.secondCall.args[0]).to.equal('inv1');
			expect(beforeAddUserToRoomPatch.firstCall.args).to.deep.equal([['alice'], room, inviterDoc]);
			expect(beforeAddUserToRoom.run.firstCall.args).to.deep.equal([{ user, inviter: inviterDoc }, room]);
			expect(beforeAddUserToRoomPatch.firstCall.calledBefore(beforeAddUserToRoom.run.firstCall)).to.be.true;
			expect(callbacksRun.firstCall.args).to.deep.equal(['beforeAddedToRoom', { user, inviter }]);
			expect(callbacksRun.firstCall.calledAfter(beforeAddUserToRoom.run.firstCall)).to.be.true;
		});

		it('passes an undefined inviter when the inviter does not exist', async () => {
			Users.findOneById.withArgs('inv1').resolves(null);

			await addUserToRoom('rid1', user, inviter);

			expect(beforeAddUserToRoomPatch.firstCall.args[2]).to.be.undefined;
			expect(beforeAddUserToRoom.run.firstCall.args[0]).to.deep.equal({ user, inviter: undefined });
		});

		it('does not look up an inviter when none is given', async () => {
			await addUserToRoom('rid1', user);

			expect(Users.findOneById.calledOnce).to.be.true;
			expect(beforeAddUserToRoomPatch.firstCall.args[2]).to.be.undefined;
		});

		it('rethrows an AbacContractError from the patch', async () => {
			const failure = new AbacContractError('abac');
			beforeAddUserToRoomPatch.rejects(failure);

			const error = await addUserToRoom('rid1', user, inviter).catch((e: unknown) => e);

			expect(error).to.equal(failure);
			expect(beforeAddUserToRoom.run.called).to.be.false;
			expect(callbacksRun.called).to.be.false;
		});

		it('rethrows a ClientSafeError from the callback', async () => {
			const failure = new ClientSafeError('error-not-allowed', 'nope');
			beforeAddUserToRoom.run.rejects(failure);

			const error = await addUserToRoom('rid1', user, inviter).catch((e: unknown) => e);

			expect(error).to.equal(failure);
			expect(callbacksRun.called).to.be.false;
		});

		it('wraps any other error in a ClientSafeError carrying its message', async () => {
			beforeAddUserToRoom.run.rejects(new Error('room is full'));

			const error = await addUserToRoom('rid1', user, inviter).catch((e: unknown) => e);

			expect(error).to.be.instanceOf(ClientSafeError);
			expect(error).to.include({ error: 'room is full' });
			expect(callbacksRun.called).to.be.false;
			expect(Room.createUserSubscription.called).to.be.false;
		});
	});

	it('triggers IPreRoomUserJoined with the room, the user and the given inviter', async () => {
		await addUserToRoom('rid1', user, inviter);

		expect(triggerEvent.firstCall.args).to.deep.equal(['IPreRoomUserJoined', room, user, inviter]);
		expect(triggerEvent.firstCall.calledAfter(callbacksRun.firstCall)).to.be.true;
	});

	it('turns an AppsEngineException from IPreRoomUserJoined into error-app-prevented', async () => {
		triggerEvent.withArgs('IPreRoomUserJoined').rejects(new AppsEngineException('app said no'));

		const error = await addUserToRoom('rid1', user).catch((e: unknown) => e);

		expect(error).to.be.instanceOf(ClientSafeError);
		expect(error).to.include({ error: 'error-app-prevented', reason: 'app said no' });
		expect(Room.createUserSubscription.called).to.be.false;
	});

	it('rethrows any other error from IPreRoomUserJoined', async () => {
		const failure = new Error('app crashed');
		triggerEvent.withArgs('IPreRoomUserJoined').rejects(failure);

		const error = await addUserToRoom('rid1', user).catch((e: unknown) => e);

		expect(error).to.equal(failure);
	});

	it('stops after the app event for native federated rooms', async () => {
		Rooms.findOneById.resolves({ ...room, federated: true, federation: { version: 1 } });

		const result = await addUserToRoom('rid1', user);

		expect(result).to.be.undefined;
		expect(triggerEvent.calledOnce).to.be.true;
		expect(Subscriptions.findOneByRoomIdAndUserId.called).to.be.false;
		expect(Room.createUserSubscription.called).to.be.false;
	});

	['c', 'p', 'l'].forEach((t) => {
		it(`runs beforeAddedToRoom with the room and beforeJoinRoom for rooms of type ${t}`, async () => {
			const typedRoom = { ...room, t };
			Rooms.findOneById.resolves(typedRoom);

			await addUserToRoom('rid1', user, inviter);

			expect(callbacksRun.getCalls().map((call) => call.args)).to.deep.equal([
				['beforeAddedToRoom', { user, inviter }],
				['beforeAddedToRoom', { user, inviter }, typedRoom],
				['beforeJoinRoom', user, typedRoom],
			]);
		});
	});

	it('does not run the join callbacks for direct rooms', async () => {
		Rooms.findOneById.resolves({ ...room, t: 'd' });

		await addUserToRoom('rid1', user, inviter);

		expect(callbacksRun.getCalls().map((call) => call.args[0])).to.deep.equal(['beforeAddedToRoom']);
	});

	it('returns true without subscribing again when the user already has a subscription', async () => {
		Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1' });

		const result = await addUserToRoom('rid1', user);

		expect(Subscriptions.findOneByRoomIdAndUserId.firstCall.args).to.deep.equal(['rid1', 'u1']);
		expect(result).to.be.true;
		expect(Subscriptions.removeByRoomIdAndUserId.called).to.be.false;
		expect(Room.createUserSubscription.called).to.be.false;
		expect(notifyOnRoomChangedById.called).to.be.false;
	});

	describe('banned user', () => {
		beforeEach(() => {
			Subscriptions.findOneByRoomIdAndUserId.resolves({ _id: 'sub1', status: 'BANNED' });
		});

		it('removes the ban, posts user-unbanned and subscribes the user again', async () => {
			const deletedSub = { _id: 'sub1', status: 'BANNED', rid: 'rid1' };
			Subscriptions.removeByRoomIdAndUserId.resolves(deletedSub);

			const result = await addUserToRoom('rid1', user, inviter);

			expect(Subscriptions.removeByRoomIdAndUserId.firstCall.args).to.deep.equal(['rid1', 'u1']);
			expect(notifyOnSubscriptionChanged.firstCall.args).to.deep.equal([deletedSub, 'removed']);
			const [type, rid, username, author, extra] = Message.saveSystemMessage.firstCall.args;
			expect([type, rid, username, author]).to.deep.equal(['user-unbanned', 'rid1', 'alice', inviter]);
			expect(extra.ts).to.equal(Room.createUserSubscription.firstCall.args[0].ts);
			expect(Message.saveSystemMessage.firstCall.calledBefore(Room.createUserSubscription.firstCall)).to.be.true;
			expect(result).to.be.true;
		});

		it('does not post user-unbanned without an inviter', async () => {
			Subscriptions.removeByRoomIdAndUserId.resolves({ _id: 'sub1' });

			await addUserToRoom('rid1', user);

			expect(Message.saveSystemMessage.called).to.be.false;
			expect(Room.createUserSubscription.calledOnce).to.be.true;
		});

		it('does not post user-unbanned when skipSystemMessage is set', async () => {
			Subscriptions.removeByRoomIdAndUserId.resolves({ _id: 'sub1' });

			await addUserToRoom('rid1', user, inviter, { skipSystemMessage: true });

			expect(Message.saveSystemMessage.called).to.be.false;
			expect(Room.createUserSubscription.calledOnce).to.be.true;
		});

		it('returns true without subscribing when the banned subscription was already gone', async () => {
			Subscriptions.removeByRoomIdAndUserId.resolves(null);

			const result = await addUserToRoom('rid1', user, inviter);

			expect(result).to.be.true;
			expect(notifyOnSubscriptionChanged.called).to.be.false;
			expect(Room.createUserSubscription.called).to.be.false;
		});
	});

	it('creates the subscription with the given options, notifies the room and returns true', async () => {
		const result = await addUserToRoom('rid1', user, inviter, { skipSystemMessage: true, skipAlertSound: true, createAsHidden: true });

		const args = Room.createUserSubscription.firstCall.args[0];
		expect(args).to.deep.include({
			room,
			inviter,
			userToBeAdded: user,
			createAsHidden: true,
			skipAlertSound: true,
			skipSystemMessage: true,
		});
		expect(args.ts).to.be.instanceOf(Date);
		expect(notifyOnRoomChangedById.firstCall.args).to.deep.equal(['rid1']);
		expect(result).to.be.true;
	});

	it('creates the subscription visible by default', async () => {
		await addUserToRoom('rid1', user);

		expect(Room.createUserSubscription.firstCall.args[0]).to.deep.include({ createAsHidden: false, inviter: undefined });
	});

	['c', 'p'].forEach((t) => {
		it(`runs the after-join hooks after returning for rooms of type ${t}`, async () => {
			const typedRoom = { ...room, t };
			Rooms.findOneById.resolves(typedRoom);

			await addUserToRoom('rid1', user, inviter);

			const afterCallsOf = () =>
				callbacksRun.getCalls().filter((call) => call.args.includes(typedRoom) && call.args[0].startsWith('after'));
			expect(afterCallsOf()).to.have.lengthOf(0);

			await nextMacrotask();

			expect(afterCallsOf().map((call) => call.args)).to.deep.equal([
				['afterAddedToRoom', { user, inviter }, typedRoom],
				['afterJoinRoom', user, typedRoom],
			]);
			expect(triggerEvent.calledWith('IPostRoomUserJoined', typedRoom, user, inviter)).to.be.true;
		});
	});

	it('does not run the after-join hooks for livechat rooms', async () => {
		const livechatRoom = { ...room, t: 'l' };
		Rooms.findOneById.resolves(livechatRoom);

		await addUserToRoom('rid1', user, inviter);
		await nextMacrotask();

		expect(callbacksRun.calledWith('afterAddedToRoom', sinon.match.any, livechatRoom)).to.be.false;
		expect(callbacksRun.calledWith('afterJoinRoom', sinon.match.any, livechatRoom)).to.be.false;
		expect(triggerEvent.calledWith('IPostRoomUserJoined', livechatRoom)).to.be.false;
	});

	it('adds a team membership on behalf of the inviter when joining the main team room', async () => {
		Rooms.findOneById.resolves({ ...room, teamMain: true, teamId: 't1' });

		await addUserToRoom('rid1', user, inviter);

		expect(Team.addMember.firstCall.args).to.deep.equal([inviter, 'u1', 't1']);
	});

	it('adds a team membership on behalf of the user when there is no inviter', async () => {
		Rooms.findOneById.resolves({ ...room, teamMain: true, teamId: 't1' });

		await addUserToRoom('rid1', user);

		expect(Team.addMember.firstCall.args).to.deep.equal([user, 'u1', 't1']);
	});

	it('does not add a team membership for a team room that is not the main one', async () => {
		Rooms.findOneById.resolves({ ...room, teamId: 't1' });

		await addUserToRoom('rid1', user);

		expect(Team.addMember.called).to.be.false;
	});

	it('queues the user for the room key of an encrypted room when E2E is on and the user has a public key', async () => {
		Rooms.findOneById.resolves({ ...room, encrypted: true });
		Users.findOneById.withArgs('u1').resolves({ ...user, e2e: { public_key: 'pk' } });
		settingsGet.withArgs('E2E_Enable').returns(true);

		await addUserToRoom('rid1', user);

		expect(Rooms.addUserIdToE2EEQueueByRoomIds.firstCall.args).to.deep.equal([['rid1'], 'u1']);
	});

	it('does not queue the user when E2E is off', async () => {
		Rooms.findOneById.resolves({ ...room, encrypted: true });
		Users.findOneById.withArgs('u1').resolves({ ...user, e2e: { public_key: 'pk' } });
		settingsGet.withArgs('E2E_Enable').returns(false);

		await addUserToRoom('rid1', user);

		expect(Rooms.addUserIdToE2EEQueueByRoomIds.called).to.be.false;
	});

	it('does not queue a user without a public key', async () => {
		Rooms.findOneById.resolves({ ...room, encrypted: true });
		settingsGet.withArgs('E2E_Enable').returns(true);

		await addUserToRoom('rid1', user);

		expect(Rooms.addUserIdToE2EEQueueByRoomIds.called).to.be.false;
	});
});
