import { before, beforeEach, describe, it, mock } from 'node:test';

import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';
import { ClientSafeError } from '@rocket.chat/core-services';
import { mockModel } from '@rocket.chat/models/testing';
import { expect } from 'chai';
import sinon from 'sinon';

const sandbox = sinon.createSandbox();

const selfTriggerEvent = sandbox.stub();
const appsTriggerEvent = sandbox.stub();
const FederationMatrix = { canUserAccessFederation: sandbox.stub(), ensureFederatedUsersExistLocally: sandbox.stub() };
const Message = { saveSystemMessage: sandbox.stub() };
const Room = { createUserSubscription: sandbox.stub() };
const Team = { getOneById: sandbox.stub() };
const XMPPServer = { ensureXMPPUsersExistLocally: sandbox.stub() };
const createDirectRoom = sandbox.stub();
const filterUsersAllowedInRoom = sandbox.stub();
const callbacks = { run: sandbox.stub(), runAsync: sandbox.stub() };
const afterCreateRoomCallback = { run: sandbox.stub() };
const beforeAddUserToRoom = { run: sandbox.stub() };
const beforeCreateRoomCallback = { run: sandbox.stub() };
const prepareCreateRoomCallback = { run: sandbox.stub() };
const getSubscriptionAutotranslateDefaultConfig = sandbox.stub();
const notifyOnRoomChanged = sandbox.stub();
const notifyOnSubscriptionChangedById = sandbox.stub();
const syncRoomRolePriorityForUserAndRoom = sandbox.stub();
const getValidRoomName = sandbox.stub();

const Rooms = { createWithFullRoomData: sandbox.stub(), incUsersCountById: sandbox.stub() };
const Subscriptions = { createWithRoomAndManyUsers: sandbox.stub(), createWithRoomAndUser: sandbox.stub() };
const Users = {
	findUsersByUsernames: sandbox.stub(),
	findOneByUsername: sandbox.stub(),
	addRoomByUserIds: sandbox.stub(),
	assignRoomRolePrioritiesByUserIdPriorityMap: sandbox.stub(),
};

const AppEvents = {
	IPreRoomCreatePrevent: 'IPreRoomCreatePrevent',
	IPreRoomCreateExtend: 'IPreRoomCreateExtend',
	IPreRoomCreateModify: 'IPreRoomCreateModify',
	IPostRoomCreate: 'IPostRoomCreate',
};

let createRoom: any;

before(async () => {
	const moduleMocks = [
		mock.module('@rocket.chat/apps', {
			exports: { Apps: { self: { triggerEvent: selfTriggerEvent }, triggerEvent: appsTriggerEvent }, AppEvents },
		}),
		mock.module('@rocket.chat/core-services', { exports: { FederationMatrix, Message, Room, Team, ClientSafeError, XMPPServer } }),
		mock.module('./createDirectRoom', { exports: { createDirectRoom } }),
		mock.module('./filterUsersAllowedInRoom', { exports: { filterUsersAllowedInRoom } }),
		mock.module('../callbacks', { exports: { callbacks } }),
		mock.module('../callbacks/afterCreateRoomCallback', { exports: { afterCreateRoomCallback } }),
		mock.module('../callbacks/beforeAddUserToRoom', { exports: { beforeAddUserToRoom } }),
		mock.module('../callbacks/beforeCreateRoomCallback', { exports: { beforeCreateRoomCallback, prepareCreateRoomCallback } }),
		mock.module('../getSubscriptionAutotranslateDefaultConfig', { exports: { getSubscriptionAutotranslateDefaultConfig } }),
		mock.module('../notifyListener', { exports: { notifyOnRoomChanged, notifyOnSubscriptionChangedById } }),
		mock.module('../roles/syncRoomRolePriority', { exports: { syncRoomRolePriorityForUserAndRoom } }),
		mock.module('../utils/lib/getValidRoomName', { exports: { getValidRoomName } }),
	];
	({ createRoom } = await import('./createRoom'));
	moduleMocks.forEach((moduleMock) => moduleMock.restore());
});

const owner = { _id: 'owner1', username: 'owner', name: 'Owner' };
const alice = { _id: 'u2', username: 'alice' };

describe('createRoom', () => {
	beforeEach(() => {
		sandbox.reset();
		mockModel('Rooms', Rooms);
		mockModel('Subscriptions', Subscriptions);
		mockModel('Users', Users);

		getValidRoomName.callsFake(async (name: string) => `valid-${name}`);
		Rooms.createWithFullRoomData.callsFake(async (props: Record<string, unknown>) => ({ _id: 'rid1', ...props }));
		Users.findUsersByUsernames.returns([{ ...owner }, { ...alice }]);
		Subscriptions.createWithRoomAndManyUsers.resolves({ insertedIds: { 0: 'sub1', 1: 'sub2' } });
		getSubscriptionAutotranslateDefaultConfig.returns({});
		selfTriggerEvent.resolves(undefined);
		appsTriggerEvent.resolves(undefined);
	});

	describe('validation', () => {
		it('rejects federated members in a room that is not federated', async () => {
			const error = await createRoom('c', 'general', owner, ['bob:server@remote']).catch((e: unknown) => e);

			expect(error).to.be.instanceOf(ClientSafeError);
			expect(error).to.include({ error: 'error-federated-users-in-non-federated-rooms' });
			expect(prepareCreateRoomCallback.run.called).to.be.false;
		});

		it('rejects a federated room when the owner cannot access federation', async () => {
			FederationMatrix.canUserAccessFederation.resolves(false);

			const error = await createRoom('c', 'general', owner, [], false, false, { federated: true }).catch((e: unknown) => e);

			expect(error).to.include({ error: 'error-not-authorized-federation' });
			expect(FederationMatrix.canUserAccessFederation.firstCall.args[0]).to.equal(owner);
			expect(prepareCreateRoomCallback.run.firstCall.args[0]).to.deep.equal({ type: 'c', extraData: { federated: true } });
			expect(Rooms.createWithFullRoomData.called).to.be.false;
		});

		it('rejects members that are not usernames', async () => {
			const error = await createRoom('c', 'general', owner, [alice]).catch((e: unknown) => e);

			expect(error).to.include({ error: 'error-invalid-members' });
		});

		it('rejects a blank name', async () => {
			const error = await createRoom('c', '  ', owner, []).catch((e: unknown) => e);

			expect(error).to.include({ error: 'error-invalid-name' });
		});

		it('rejects a missing owner', async () => {
			const error = await createRoom('c', 'general', undefined, []).catch((e: unknown) => e);

			expect(error).to.include({ error: 'error-invalid-user' });
		});

		it('rejects an owner without username', async () => {
			const error = await createRoom('c', 'general', { _id: 'owner1' }, []).catch((e: unknown) => e);

			expect(error).to.include({ error: 'error-invalid-user' });
		});
	});

	it('delegates direct rooms to createDirectRoom with the owner as creator and without teamId', async () => {
		const created = { _id: 'dm1', rid: 'dm1', t: 'd', inserted: true };
		createDirectRoom.resolves(created);

		const result = await createRoom('d', undefined, owner, [alice], false, false, { teamId: 't1', topic: 'x' }, { forceNew: true });

		expect(result).to.equal(created);
		expect(createDirectRoom.firstCall.args).to.deep.equal([[alice], { topic: 'x' }, { forceNew: true, creator: 'owner1' }]);
		expect(Rooms.createWithFullRoomData.called).to.be.false;
	});

	it('keeps an explicit creator for direct rooms', async () => {
		await createRoom('d', undefined, owner, [alice], false, false, {}, { creator: 'other' });

		expect(createDirectRoom.firstCall.args[2]).to.deep.equal({ creator: 'other' });
	});

	it('creates the room with the computed properties and adds the owner to the members', async () => {
		await createRoom('c', ' general ', owner, ['alice'], false, false, { topic: 'hi' });

		const props = Rooms.createWithFullRoomData.firstCall.args[0];
		expect(getValidRoomName.firstCall.args).to.deep.equal(['general', undefined]);
		expect(props).to.deep.include({
			fname: ' general ',
			topic: 'hi',
			name: 'valid-general',
			t: 'c',
			msgs: 0,
			usersCount: 0,
			u: { _id: 'owner1', username: 'owner', name: 'Owner' },
			ro: false,
		});
		expect(props.ts).to.be.instanceOf(Date);
		expect(props._updatedAt).to.equal(props.ts);
		expect(props).to.not.have.property('_USERNAMES');
		expect(beforeCreateRoomCallback.run.firstCall.args[0]).to.deep.equal({ owner, room: props, members: ['alice', 'owner'] });
	});

	it('does not add the owner when excludeSelf is set', async () => {
		await createRoom('c', 'general', owner, ['alice'], true);

		expect(beforeCreateRoomCallback.run.firstCall.args[0].members).to.deep.equal(['alice']);
	});

	it('makes broadcast rooms read-only and drops reactWhenReadOnly', async () => {
		await createRoom('c', 'general', owner, [], false, false, { broadcast: true, reactWhenReadOnly: true });

		const props = Rooms.createWithFullRoomData.firstCall.args[0];
		expect(props.ro).to.be.true;
		expect(props).to.not.have.property('reactWhenReadOnly');
	});

	it('keeps the given name of a discussion', async () => {
		await createRoom('p', 'Some Discussion', owner, [], false, false, { prid: 'parent' });

		expect(getValidRoomName.called).to.be.false;
		expect(Rooms.createWithFullRoomData.firstCall.args[0]).to.deep.include({ name: 'Some Discussion', prid: 'parent' });
	});

	it('sets the teamId only when the team exists', async () => {
		Team.getOneById.withArgs('t1').resolves({ _id: 't1', roomId: 'teamRoom' });

		await createRoom('p', 'general', owner, [], false, false, { teamId: 't1' });
		await createRoom('p', 'general', owner, [], false, false, { teamId: 'missing' });

		expect(Team.getOneById.firstCall.args).to.deep.equal(['t1', { projection: { _id: 1 } }]);
		expect(Rooms.createWithFullRoomData.firstCall.args[0].teamId).to.equal('t1');
		expect(Rooms.createWithFullRoomData.secondCall.args[0]).to.not.have.property('teamId');
	});

	describe('app events before creation', () => {
		it('triggers prevent on Apps.self, extend on Apps and modify on Apps.self with the extend result', async () => {
			const seen: unknown[] = [];
			selfTriggerEvent.callsFake(async (event: string, room: Record<string, unknown>) => {
				seen.push([event, room && { ...room }]);
			});
			appsTriggerEvent.resolves({ extended: true });

			await createRoom('c', 'general', owner, ['alice']);

			expect(seen[0]).to.deep.equal([
				'IPreRoomCreatePrevent',
				{ ...Rooms.createWithFullRoomData.firstCall.args[0], _USERNAMES: ['alice', 'owner'] },
			]);
			expect(appsTriggerEvent.firstCall.args[0]).to.equal('IPreRoomCreateExtend');
			expect(appsTriggerEvent.firstCall.args[1]).to.deep.include({ _USERNAMES: ['alice', 'owner'] });
			expect(selfTriggerEvent.secondCall.args).to.deep.equal(['IPreRoomCreateModify', { extended: true }]);
			expect(selfTriggerEvent.secondCall.calledBefore(beforeCreateRoomCallback.run.firstCall)).to.be.true;
		});

		it('merges the object returned by modify, without _USERNAMES, into the room', async () => {
			selfTriggerEvent.withArgs(AppEvents.IPreRoomCreateModify).resolves({ topic: 'from app', _USERNAMES: ['x'] });

			await createRoom('c', 'general', owner, [], false, false, { topic: 'original' });

			const props = Rooms.createWithFullRoomData.firstCall.args[0];
			expect(props.topic).to.equal('from app');
			expect(props).to.not.have.property('_USERNAMES');
		});

		it('ignores a non-object result of modify', async () => {
			selfTriggerEvent.withArgs(AppEvents.IPreRoomCreateModify).resolves(true);

			await createRoom('c', 'general', owner, [], false, false, { topic: 'original' });

			expect(Rooms.createWithFullRoomData.firstCall.args[0].topic).to.equal('original');
		});

		it('throws error-app-prevented when an app prevents the creation', async () => {
			selfTriggerEvent.withArgs(AppEvents.IPreRoomCreatePrevent).resolves(true);

			const error = await createRoom('c', 'general', owner, []).catch((e: unknown) => e);

			expect(error).to.be.instanceOf(ClientSafeError);
			expect(error).to.include({ error: 'error-app-prevented', reason: 'A Rocket.Chat App prevented the room creation.' });
			expect(appsTriggerEvent.called).to.be.false;
			expect(beforeCreateRoomCallback.run.called).to.be.false;
			expect(Rooms.createWithFullRoomData.called).to.be.false;
		});

		it('turns an AppsEngineException from prevent into error-app-prevented with its message', async () => {
			selfTriggerEvent.withArgs(AppEvents.IPreRoomCreatePrevent).rejects(new AppsEngineException('blocked by app'));

			const error = await createRoom('c', 'general', owner, []).catch((e: unknown) => e);

			expect(error).to.be.instanceOf(ClientSafeError);
			expect(error).to.include({ error: 'error-app-prevented', reason: 'blocked by app' });
			expect(Rooms.createWithFullRoomData.called).to.be.false;
		});

		it('rethrows any other error from prevent', async () => {
			const failure = new Error('app crashed');
			selfTriggerEvent.withArgs(AppEvents.IPreRoomCreatePrevent).rejects(failure);

			const error = await createRoom('c', 'general', owner, []).catch((e: unknown) => e);

			expect(error).to.equal(failure);
			expect(Rooms.createWithFullRoomData.called).to.be.false;
		});
	});

	it('runs beforeCreateChannel only for channels, after beforeCreateRoomCallback', async () => {
		await createRoom('c', 'general', owner, []);
		await createRoom('p', 'secret', owner, []);

		const beforeChannelCalls = callbacks.run.getCalls().filter((call) => call.args[0] === 'beforeCreateChannel');
		expect(beforeChannelCalls).to.have.lengthOf(1);
		expect(beforeChannelCalls[0].args[1]).to.equal(owner);
		expect(beforeChannelCalls[0].args[2]).to.deep.include({ name: 'valid-general', t: 'c' });
		expect(beforeChannelCalls[0].calledAfter(beforeCreateRoomCallback.run.firstCall)).to.be.true;
		expect(beforeChannelCalls[0].calledBefore(Rooms.createWithFullRoomData.firstCall)).to.be.true;
	});

	describe('subscriptions', () => {
		it('subscribes the allowed members, making the owner owner, and counts them', async () => {
			getSubscriptionAutotranslateDefaultConfig.withArgs(sinon.match({ _id: 'u2' })).returns({ autoTranslate: true });

			await createRoom('c', 'general', owner, ['alice'], false, false, {}, { subscriptionExtra: { open: false, prid: 'x' } });

			expect(notifyOnRoomChanged.firstCall.args[0]).to.deep.include({ _id: 'rid1' });
			expect(notifyOnRoomChanged.firstCall.args[1]).to.equal('inserted');
			expect(Users.findUsersByUsernames.firstCall.args[0]).to.deep.equal(['alice', 'owner']);
			expect(beforeAddUserToRoom.run.firstCall.args[0]).to.deep.equal({ user: owner, inviter: owner });
			expect(callbacks.run.calledWith('beforeAddedToRoom', { user: alice, inviter: owner })).to.be.true;
			expect(Users.addRoomByUserIds.firstCall.args).to.deep.equal([['owner1', 'u2'], 'rid1']);

			const [room, subs] = Subscriptions.createWithRoomAndManyUsers.firstCall.args;
			expect(room._id).to.equal('rid1');
			expect(subs[0].user).to.deep.equal(owner);
			expect(subs[0].extraData).to.deep.include({ open: false, prid: 'x', roles: ['owner'] });
			expect(subs[0].extraData.ls).to.be.instanceOf(Date);
			expect(subs[1].extraData).to.deep.equal({ open: false, prid: 'x', autoTranslate: true });

			expect(Users.assignRoomRolePrioritiesByUserIdPriorityMap.firstCall.args).to.deep.equal([{ owner1: 0 }, 'rid1']);
			expect(notifyOnSubscriptionChangedById.getCalls().map((call) => call.args)).to.deep.equal([
				['sub1', 'inserted'],
				['sub2', 'inserted'],
			]);
			expect(Rooms.incUsersCountById.firstCall.args).to.deep.equal(['rid1', 2]);
		});

		it('sets the parent room id on discussion subscriptions', async () => {
			await createRoom('p', 'disc', owner, ['alice'], false, false, { prid: 'parent' });

			const subs = Subscriptions.createWithRoomAndManyUsers.firstCall.args[1];
			expect(subs[1].extraData).to.deep.include({ prid: 'parent' });
		});

		it('skips members rejected by the before-add hooks', async () => {
			beforeAddUserToRoom.run.withArgs(sinon.match({ user: { _id: 'u2' } })).rejects(new Error('not allowed'));

			await createRoom('c', 'general', owner, ['alice']);

			expect(Users.addRoomByUserIds.firstCall.args[0]).to.deep.equal(['owner1']);
			expect(Subscriptions.createWithRoomAndManyUsers.firstCall.args[1]).to.have.lengthOf(1);
			expect(Rooms.incUsersCountById.firstCall.args).to.deep.equal(['rid1', 1]);
		});

		it('creates no subscription when every member is rejected', async () => {
			beforeAddUserToRoom.run.rejects(new Error('not allowed'));

			const result = await createRoom('c', 'general', owner, ['alice']);

			expect(Users.addRoomByUserIds.firstCall.args[0]).to.deep.equal([]);
			expect(Subscriptions.createWithRoomAndManyUsers.called).to.be.false;
			expect(Rooms.incUsersCountById.called).to.be.false;
			expect(result).to.not.have.property('skippedMembers');
		});

		it('does not link the users to livechat rooms', async () => {
			await createRoom('l', 'visitor', owner, []);

			expect(Users.addRoomByUserIds.called).to.be.false;
		});

		it('returns the members an ABAC room skipped', async () => {
			const candidates = Object.assign([{ ...owner }, { ...alice }], { toArray: async () => [{ ...owner }, { ...alice }] });
			Users.findUsersByUsernames
				.onFirstCall()
				.returns(candidates)
				.onSecondCall()
				.returns([{ ...owner }]);
			filterUsersAllowedInRoom.resolves([{ ...owner }]);

			const result = await createRoom('p', 'secret', owner, ['alice'], false, false, { abacAttributes: [{ key: 'k', values: ['v'] }] });

			expect(Users.findUsersByUsernames.secondCall.args[0]).to.deep.equal(['owner']);
			expect(result.skippedMembers).to.deep.equal(['alice']);
			expect(
				Subscriptions.createWithRoomAndManyUsers.firstCall.args[1].map(({ user }: { user: { username: string } }) => user.username),
			).to.deep.equal(['owner']);
		});
	});

	describe('federated rooms', () => {
		beforeEach(() => {
			FederationMatrix.canUserAccessFederation.resolves(true);
			Subscriptions.createWithRoomAndUser.resolves({ insertedId: 'ownerSub' });
			Users.findOneByUsername.withArgs('bob:server@remote').resolves({ _id: 'remote1', username: 'bob:server@remote' });
		});

		it('creates the matrix room before subscribing the owner and inviting the members', async () => {
			await createRoom('p', 'fed', owner, ['bob:server@remote'], false, false, { federated: true }, { subscriptionExtra: { prid: 'x' } });

			const federationCall = callbacks.run.getCalls().find((call) => call.args[0] === 'federation.afterCreateFederatedRoom');
			expect(federationCall?.args[2]).to.deep.equal({
				owner,
				originalMemberList: ['bob:server@remote', 'owner'],
				options: { subscriptionExtra: { prid: 'x' } },
			});
			expect(federationCall?.calledBefore(Subscriptions.createWithRoomAndUser.firstCall)).to.be.true;

			const [room, user, extra] = Subscriptions.createWithRoomAndUser.firstCall.args;
			expect(room._id).to.equal('rid1');
			expect(user).to.equal(owner);
			expect(extra).to.deep.include({ prid: 'x', open: true, roles: ['owner'] });
			expect(extra.ls).to.be.instanceOf(Date);
			expect(syncRoomRolePriorityForUserAndRoom.firstCall.args).to.deep.equal(['owner1', 'rid1', ['owner']]);
			expect(notifyOnSubscriptionChangedById.firstCall.args).to.deep.equal(['ownerSub', 'inserted']);
			expect(notifyOnRoomChanged.secondCall.args[1]).to.equal('inserted');
			expect(FederationMatrix.ensureFederatedUsersExistLocally.firstCall.args[0]).to.deep.equal(['bob:server@remote']);
			expect(Room.createUserSubscription.firstCall.args[0]).to.deep.include({
				userToBeAdded: { _id: 'remote1', username: 'bob:server@remote' },
				inviter: owner,
				status: 'INVITED',
			});
			expect(Subscriptions.createWithRoomAndManyUsers.called).to.be.false;
		});

		it('throws when an invited federated user does not exist locally', async () => {
			Users.findOneByUsername.withArgs('bob:server@remote').resolves(null);

			const error = await createRoom('p', 'fed', owner, ['bob:server@remote'], false, false, { federated: true }).catch((e: unknown) => e);

			expect(error).to.be.instanceOf(Error);
			expect((error as Error).message).to.equal('Federated user not found locally');
		});
	});

	describe('after creation', () => {
		it('posts the team system message and runs the channel hooks in order for a team channel', async () => {
			Team.getOneById.resolves({ _id: 't1', roomId: 'teamRoom' });

			const result = await createRoom('c', 'general', owner, [], false, false, { teamId: 't1' }, { app: 'app1' } as any);

			expect(Team.getOneById.secondCall.args).to.deep.equal(['t1']);
			expect(Message.saveSystemMessage.firstCall.args).to.deep.equal(['user-added-room-to-team', 'teamRoom', 'valid-general', owner]);
			expect(callbacks.runAsync.getCalls().map((call) => call.args[0])).to.deep.equal(['afterCreateChannel', 'afterCreateRoom']);
			expect(callbacks.runAsync.firstCall.args[1]).to.equal(owner);
			expect(callbacks.runAsync.firstCall.args[2]._id).to.equal('rid1');
			expect(Message.saveSystemMessage.firstCall.calledBefore(callbacks.runAsync.firstCall)).to.be.true;
			expect(afterCreateRoomCallback.run.firstCall.args[0]).to.deep.include({ owner, app: 'app1' });
			expect(afterCreateRoomCallback.run.firstCall.args[0].room._id).to.equal('rid1');
			expect(afterCreateRoomCallback.run.firstCall.calledAfter(callbacks.runAsync.secondCall)).to.be.true;
			expect(selfTriggerEvent.lastCall.args[0]).to.equal('IPostRoomCreate');
			expect(selfTriggerEvent.lastCall.args[1]._id).to.equal('rid1');
			expect(selfTriggerEvent.lastCall.calledAfter(afterCreateRoomCallback.run.firstCall)).to.be.true;
			expect(result).to.deep.include({ rid: 'rid1', inserted: true, _id: 'rid1', name: 'valid-general', teamId: 't1' });
		});

		it('does not post the team system message when the team is gone', async () => {
			Team.getOneById.onFirstCall().resolves({ _id: 't1', roomId: 'teamRoom' });
			Team.getOneById.onSecondCall().resolves(null);

			await createRoom('c', 'general', owner, [], false, false, { teamId: 't1' });

			expect(Message.saveSystemMessage.called).to.be.false;
			expect(callbacks.runAsync.firstCall.args[0]).to.equal('afterCreateChannel');
		});

		it('does not look up a team for a channel outside a team', async () => {
			await createRoom('c', 'general', owner, []);

			expect(Team.getOneById.called).to.be.false;
		});

		it('runs afterCreatePrivateGroup for private groups', async () => {
			Team.getOneById.resolves({ _id: 't1', roomId: 'teamRoom' });

			await createRoom('p', 'secret', owner, [], false, false, { teamId: 't1' });

			expect(Team.getOneById.calledOnce).to.be.true;
			expect(Message.saveSystemMessage.called).to.be.false;
			expect(callbacks.runAsync.getCalls().map((call) => call.args[0])).to.deep.equal(['afterCreatePrivateGroup', 'afterCreateRoom']);
		});

		it('runs only afterCreateRoom for other room types', async () => {
			await createRoom('l', 'visitor', owner, []);

			expect(callbacks.runAsync.getCalls().map((call) => call.args[0])).to.deep.equal(['afterCreateRoom']);
			expect(afterCreateRoomCallback.run.firstCall.args[0].app).to.be.undefined;
			expect(selfTriggerEvent.lastCall.args[0]).to.equal('IPostRoomCreate');
		});
	});
});
