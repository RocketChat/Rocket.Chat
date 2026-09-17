import { MeteorError } from '@rocket.chat/core-services';
import type { IRoomService } from '@rocket.chat/core-services';
import type { ISubscription, IUser } from '@rocket.chat/core-typings';
import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

import { createFakeOmnichannelRoom, createFakeRoom, createFakeSubscription, createFakeUser } from '../../../../mocks/data';

const sandbox = sinon.createSandbox();

const Authorization = { hasPermission: sandbox.stub(), canAccessRoom: sandbox.stub() };
const Message = { saveSystemMessage: sandbox.stub() };
const FederationMatrix = { canUserAccessFederation: sandbox.stub() };
const FederationActions = { shouldPerformFederationAction: sandbox.stub() };

const Rooms = { findOneByJoinCodeAndId: sandbox.stub() };
const Subscriptions = {
	findByRoomId: sandbox.stub(),
	findByUserIdAndRoomIds: sandbox.stub(),
	updateOne: sandbox.stub(),
	createWithRoomAndUser: sandbox.stub(),
	removeInvitedByRoomIdAndUserId: sandbox.stub(),
	unbanToInvitedById: sandbox.stub(),
};
const Users = { findOneById: sandbox.stub(), findUsersByIds: sandbox.stub() };

const notifyOnSubscriptionChanged = sandbox.stub();
const notifyOnSubscriptionChangedById = sandbox.stub();
const notifyOnSubscriptionChangedByRoomIdAndUserId = sandbox.stub();

const allowMemberAction = sandbox.stub();
const roomCoordinator = { getRoomDirectives: sandbox.stub() };

const readThread = sandbox.stub();
const readMessages = sandbox.stub();
const addUserToRoom = sandbox.stub();
const createRoom = sandbox.stub();
const saveRoomName = sandbox.stub();
const createDirectMessage = sandbox.stub();

const roleMethods = {
	addRoomLeader: sandbox.stub(),
	addRoomModerator: sandbox.stub(),
	addRoomOwner: sandbox.stub(),
	removeRoomLeader: sandbox.stub(),
	removeRoomModerator: sandbox.stub(),
	removeRoomOwner: sandbox.stub(),
};

const { RoomService } = proxyquire.noCallThru().load('../../../../../server/services/room/service', {
	'@rocket.chat/core-services': {
		ServiceClassInternal: class {},
		Authorization,
		Message,
		MeteorError,
		FederationMatrix,
	},
	'@rocket.chat/models': { Rooms, Subscriptions, Users },
	'./hooks/BeforeFederationActions': { FederationActions },
	'../../lib/getSubscriptionAutotranslateDefaultConfig': { getSubscriptionAutotranslateDefaultConfig: () => undefined },
	'../../lib/messaging/threads/functions': { readThread },
	'../../lib/notifyListener': {
		notifyOnSubscriptionChanged,
		notifyOnSubscriptionChangedById,
		notifyOnSubscriptionChangedByRoomIdAndUserId,
	},
	'../../lib/readMessages': { readMessages },
	'../../lib/rooms/acceptRoomInvite': {},
	'../../lib/rooms/addUserToRoom': { addUserToRoom },
	'../../lib/rooms/createRoom': { createRoom },
	'../../lib/rooms/removeUserFromRoom': {},
	'../../lib/rooms/roomCoordinator': { roomCoordinator },
	'../../lib/rooms/settings': { saveRoomName },
	'../../lib/rooms/settings/saveRoomTopic': {},
	'../../lib/utils/lib/getValidRoomName': {},
	'../../meteor-methods/messages/createDirectMessage': { createDirectMessage },
	'../../meteor-methods/rooms/addRoomLeader': { addRoomLeader: roleMethods.addRoomLeader },
	'../../meteor-methods/rooms/addRoomModerator': { addRoomModerator: roleMethods.addRoomModerator },
	'../../meteor-methods/rooms/addRoomOwner': { addRoomOwner: roleMethods.addRoomOwner },
	'../../meteor-methods/rooms/removeRoomLeader': { removeRoomLeader: roleMethods.removeRoomLeader },
	'../../meteor-methods/rooms/removeRoomModerator': { removeRoomModerator: roleMethods.removeRoomModerator },
	'../../meteor-methods/rooms/removeRoomOwner': { removeRoomOwner: roleMethods.removeRoomOwner },
});

const cursorOf = <T>(docs: T[]) => ({ toArray: async () => docs });

const renamedTo = (_id: string, fname: string, name: string) => [{ _id }, { $set: { fname, name } }] as const;

const createDirectMessageSubscription = (_id: string, user: Pick<IUser, '_id'>, status?: ISubscription['status']) => ({
	_id,
	u: { _id: user._id },
	...(status && { status }),
});

describe('RoomService', () => {
	let service: IRoomService;

	beforeEach(() => {
		sandbox.reset();
		roomCoordinator.getRoomDirectives.returns({ allowMemberAction });
		service = new RoomService();
	});

	describe('updateDirectMessageRoomName', () => {
		const dm = createFakeRoom({ _id: 'dm-id', t: 'd' });
		const alice = { _id: 'alice-id', name: 'Alice', username: 'alice' };
		const bob = { _id: 'bob-id', name: 'Bob', username: 'bob' };
		const carol = { _id: 'carol-id', name: 'Carol', username: 'carol' };

		beforeEach(() => {
			Users.findUsersByIds.callsFake((ids: string[]) => cursorOf([alice, bob, carol].filter(({ _id }) => ids.includes(_id))));
		});

		it('rejects rooms that are not direct messages without touching their subscriptions', async () => {
			await expect(service.updateDirectMessageRoomName(createFakeRoom({ t: 'c' }))).to.be.rejectedWith('Invalid room type');

			expect(Subscriptions.findByRoomId.notCalled).to.be.true;
			expect(Subscriptions.updateOne.notCalled).to.be.true;
		});

		it('names each member subscription after the other members and notifies the update', async () => {
			Subscriptions.findByRoomId.returns(
				cursorOf([createDirectMessageSubscription('alice-sub', alice), createDirectMessageSubscription('bob-sub', bob)]),
			);

			expect(await service.updateDirectMessageRoomName(dm)).to.be.true;

			expect(Subscriptions.findByRoomId.calledOnceWithExactly('dm-id', { projection: { u: 1, status: 1 } })).to.be.true;
			expect(Users.findUsersByIds.calledOnceWithExactly(['alice-id', 'bob-id'], { projection: { name: 1, username: 1 } })).to.be.true;
			expect(Subscriptions.updateOne.calledTwice).to.be.true;
			expect(Subscriptions.updateOne.calledWithExactly(...renamedTo('alice-sub', 'Bob', 'bob'))).to.be.true;
			expect(Subscriptions.updateOne.calledWithExactly(...renamedTo('bob-sub', 'Alice', 'alice'))).to.be.true;
			expect(notifyOnSubscriptionChangedByRoomIdAndUserId.calledTwice).to.be.true;
			expect(notifyOnSubscriptionChangedByRoomIdAndUserId.calledWithExactly('dm-id', 'alice-id', 'updated')).to.be.true;
			expect(notifyOnSubscriptionChangedByRoomIdAndUserId.calledWithExactly('dm-id', 'bob-id', 'updated')).to.be.true;
		});

		it('uses the supplied names instead of loading those users from the database', async () => {
			Subscriptions.findByRoomId.returns(
				cursorOf([
					createDirectMessageSubscription('alice-sub', alice),
					createDirectMessageSubscription('bob-sub', bob),
					createDirectMessageSubscription('carol-sub', carol),
				]),
			);

			await service.updateDirectMessageRoomName(dm, undefined, [
				{ ...bob, name: 'Robert' },
				{ ...carol, name: 'Caroline' },
			]);

			expect(Users.findUsersByIds.calledOnceWithExactly(['alice-id'], { projection: { name: 1, username: 1 } })).to.be.true;
			expect(Subscriptions.updateOne.calledWithExactly(...renamedTo('alice-sub', 'Caroline, Robert', 'carol, bob'))).to.be.true;
			expect(Subscriptions.updateOne.calledWithExactly(...renamedTo('bob-sub', 'Alice, Caroline', 'alice, carol'))).to.be.true;
			expect(Subscriptions.updateOne.calledWithExactly(...renamedTo('carol-sub', 'Alice, Robert', 'alice, bob'))).to.be.true;
		});

		it('leaves pending invitations untouched', async () => {
			Subscriptions.findByRoomId.returns(
				cursorOf([createDirectMessageSubscription('alice-sub', alice, 'INVITED'), createDirectMessageSubscription('bob-sub', bob)]),
			);

			await service.updateDirectMessageRoomName(dm);

			expect(Subscriptions.updateOne.calledOnceWithExactly(...renamedTo('bob-sub', 'Alice', 'alice'))).to.be.true;
			expect(notifyOnSubscriptionChangedByRoomIdAndUserId.calledOnceWithExactly('dm-id', 'bob-id', 'updated')).to.be.true;
		});

		it('renames a pending invitation whose id is explicitly ignored', async () => {
			Subscriptions.findByRoomId.returns(
				cursorOf([createDirectMessageSubscription('alice-sub', alice, 'INVITED'), createDirectMessageSubscription('bob-sub', bob)]),
			);

			await service.updateDirectMessageRoomName(dm, ['alice-sub']);

			expect(Subscriptions.updateOne.calledTwice).to.be.true;
			expect(Subscriptions.updateOne.calledWithExactly(...renamedTo('alice-sub', 'Bob', 'bob'))).to.be.true;
			expect(notifyOnSubscriptionChangedByRoomIdAndUserId.calledWithExactly('dm-id', 'alice-id', 'updated')).to.be.true;
		});
	});

	describe('create', () => {
		const caller = createFakeUser({ _id: 'caller-id', username: 'caller' });

		beforeEach(() => {
			Authorization.hasPermission.resolves(false);
			Authorization.hasPermission.withArgs('caller-id', 'create-p').resolves(true);
			Users.findOneById.withArgs('caller-id').resolves(caller);
		});

		it('creates the room on behalf of the resolved caller', async () => {
			const created = createFakeRoom({ t: 'p', name: 'secret' });
			createRoom.resolves(created);
			const extraData = { topic: 'plans' };
			const options = { creator: 'caller-id' };

			const result = await service.create('caller-id', { type: 'p', name: 'secret', members: ['bob'], readOnly: true, extraData, options });

			expect(result).to.equal(created);
			expect(createRoom.calledOnceWithExactly('p', 'secret', caller, ['bob'], false, true, extraData, options)).to.be.true;
		});

		it('rejects callers without the create permission for the requested room type', async () => {
			await expect(service.create('caller-id', { type: 'c', name: 'general' })).to.be.rejectedWith('no-permission');

			expect(Authorization.hasPermission.calledOnceWithExactly('caller-id', 'create-c')).to.be.true;
			expect(Users.findOneById.notCalled).to.be.true;
			expect(createRoom.notCalled).to.be.true;
		});

		it('rejects callers that do not resolve to a user', async () => {
			Users.findOneById.withArgs('caller-id').resolves(null);

			await expect(service.create('caller-id', { type: 'p', name: 'secret' })).to.be.rejectedWith('User not found');

			expect(createRoom.notCalled).to.be.true;
		});

		it('rejects callers without a username', async () => {
			Users.findOneById.withArgs('caller-id').resolves({ ...caller, username: undefined });

			await expect(service.create('caller-id', { type: 'p', name: 'secret' })).to.be.rejectedWith('User not found');

			expect(createRoom.notCalled).to.be.true;
		});
	});

	describe('createDirectMessage', () => {
		beforeEach(() => {
			Users.findOneById.withArgs('to-id').resolves({ _id: 'to-id', username: 'bob' });
			Users.findOneById.withArgs('from-id').resolves({ _id: 'from-id' });
		});

		it('opens a direct message from the sender to the recipient username', async () => {
			createDirectMessage.resolves({ rid: 'dm-id' });

			expect(await service.createDirectMessage({ to: 'to-id', from: 'from-id' })).to.deep.equal({ rid: 'dm-id' });
			expect(createDirectMessage.calledOnceWithExactly(['bob'], 'from-id')).to.be.true;
		});

		it('rejects a recipient that does not exist', async () => {
			Users.findOneById.withArgs('to-id').resolves(null);

			await expect(service.createDirectMessage({ to: 'to-id', from: 'from-id' })).to.be.rejectedWith('error-invalid-user');

			expect(createDirectMessage.notCalled).to.be.true;
		});

		it('rejects a recipient without a username', async () => {
			Users.findOneById.withArgs('to-id').resolves({ _id: 'to-id' });

			await expect(service.createDirectMessage({ to: 'to-id', from: 'from-id' })).to.be.rejectedWith('error-invalid-user');

			expect(createDirectMessage.notCalled).to.be.true;
		});

		it('rejects a sender that does not exist', async () => {
			Users.findOneById.withArgs('from-id').resolves(null);

			await expect(service.createDirectMessage({ to: 'to-id', from: 'from-id' })).to.be.rejectedWith('error-invalid-user');

			expect(createDirectMessage.notCalled).to.be.true;
		});
	});

	describe('addMember', () => {
		it('rejects callers who cannot add users to the room', async () => {
			Authorization.hasPermission.resolves(false);

			await expect(service.addMember('caller-id', 'room-id')).to.be.rejectedWith('no-permission');

			expect(Authorization.hasPermission.calledOnceWithExactly('caller-id', 'add-user-to-joined-room', 'room-id')).to.be.true;
		});

		it('allows callers who can add users to the room', async () => {
			Authorization.hasPermission.withArgs('caller-id', 'add-user-to-joined-room', 'room-id').resolves(true);

			expect(await service.addMember('caller-id', 'room-id')).to.be.true;
		});
	});

	describe('join', () => {
		const user = createFakeUser({ _id: 'joiner-id' });
		const room = createFakeRoom({ _id: 'room-id', t: 'c' });

		beforeEach(() => {
			allowMemberAction.resolves(true);
			Authorization.canAccessRoom.resolves(true);
			Authorization.hasPermission.resolves(false);
			FederationActions.shouldPerformFederationAction.returns(false);
			FederationMatrix.canUserAccessFederation.resolves(true);
			addUserToRoom.resolves(true);
		});

		it('adds the user to the room', async () => {
			expect(await service.join({ room, user })).to.be.true;
			expect(addUserToRoom.calledOnceWithExactly('room-id', user)).to.be.true;
		});

		it('rejects when the room type does not allow joining', async () => {
			allowMemberAction.resolves(false);

			await expect(service.join({ room, user })).to.be.rejectedWith(MeteorError, 'Not allowed [error-not-allowed]');

			expect(roomCoordinator.getRoomDirectives.calledOnceWithExactly('c')).to.be.true;
			expect(allowMemberAction.calledOnceWithExactly(room, 'join', 'joiner-id')).to.be.true;
			expect(Authorization.canAccessRoom.notCalled).to.be.true;
			expect(addUserToRoom.notCalled).to.be.true;
		});

		it('rejects closed omnichannel rooms', async () => {
			await expect(service.join({ room: createFakeOmnichannelRoom({ open: false }), user })).to.be.rejectedWith(
				MeteorError,
				'Room is closed [room-closed]',
			);

			expect(addUserToRoom.notCalled).to.be.true;
		});

		it('rejects users who cannot access the room', async () => {
			Authorization.canAccessRoom.resolves(false);

			await expect(service.join({ room, user })).to.be.rejectedWith(MeteorError, 'Not allowed [error-not-allowed]');

			expect(Authorization.canAccessRoom.calledOnceWithExactly(room, user)).to.be.true;
			expect(addUserToRoom.notCalled).to.be.true;
		});

		describe('federated rooms', () => {
			beforeEach(() => {
				FederationActions.shouldPerformFederationAction.withArgs(room).returns(true);
			});

			it('rejects local users who cannot access federation', async () => {
				FederationMatrix.canUserAccessFederation.resolves(false);

				await expect(service.join({ room, user })).to.be.rejectedWith(
					MeteorError,
					'Not authorized to access federation [error-not-authorized-federation]',
				);

				expect(FederationMatrix.canUserAccessFederation.calledOnceWithExactly(user)).to.be.true;
				expect(addUserToRoom.notCalled).to.be.true;
			});

			it('admits local users who can access federation', async () => {
				await service.join({ room, user });

				expect(FederationMatrix.canUserAccessFederation.calledOnceWithExactly(user)).to.be.true;
				expect(addUserToRoom.calledOnce).to.be.true;
			});

			it('admits native federated users without checking their federation access', async () => {
				FederationMatrix.canUserAccessFederation.resolves(false);
				const remoteUser = createFakeUser({
					federated: true,
					federation: { version: 1, mui: '@remote:remote.test', origin: 'remote.test' },
				});

				await service.join({ room, user: remoteUser });

				expect(FederationMatrix.canUserAccessFederation.notCalled).to.be.true;
				expect(addUserToRoom.calledOnce).to.be.true;
			});

			it('does not check federation access for rooms that are not federated', async () => {
				FederationMatrix.canUserAccessFederation.resolves(false);
				const localRoom = createFakeRoom({ t: 'c' });

				await service.join({ room: localRoom, user });

				expect(FederationActions.shouldPerformFederationAction.calledOnceWithExactly(localRoom)).to.be.true;
				expect(FederationMatrix.canUserAccessFederation.notCalled).to.be.true;
				expect(addUserToRoom.calledOnce).to.be.true;
			});
		});

		describe('rooms that require a join code', () => {
			const lockedRoom = createFakeRoom({ _id: 'locked-id', t: 'c', joinCodeRequired: true });

			beforeEach(() => {
				Rooms.findOneByJoinCodeAndId.resolves(null);
				Rooms.findOneByJoinCodeAndId.withArgs('open-sesame', 'locked-id').resolves({ _id: 'locked-id' });
			});

			it('rejects a join without a code', async () => {
				await expect(service.join({ room: lockedRoom, user })).to.be.rejectedWith(MeteorError, 'Code required [error-code-required]');

				expect(Authorization.hasPermission.calledOnceWithExactly('joiner-id', 'join-without-join-code')).to.be.true;
				expect(Rooms.findOneByJoinCodeAndId.notCalled).to.be.true;
				expect(addUserToRoom.notCalled).to.be.true;
			});

			it('rejects a join with a wrong code', async () => {
				await expect(service.join({ room: lockedRoom, user, joinCode: 'guess' })).to.be.rejectedWith(
					MeteorError,
					'Invalid code [error-code-invalid]',
				);

				expect(Rooms.findOneByJoinCodeAndId.calledOnceWithExactly('guess', 'locked-id', { projection: { _id: 1 } })).to.be.true;
				expect(addUserToRoom.notCalled).to.be.true;
			});

			it('admits a join with the right code', async () => {
				await service.join({ room: lockedRoom, user, joinCode: 'open-sesame' });

				expect(addUserToRoom.calledOnceWithExactly('locked-id', user)).to.be.true;
			});

			it('admits users allowed to join without a code', async () => {
				Authorization.hasPermission.withArgs('joiner-id', 'join-without-join-code').resolves(true);

				await service.join({ room: lockedRoom, user });

				expect(Rooms.findOneByJoinCodeAndId.notCalled).to.be.true;
				expect(addUserToRoom.calledOnceWithExactly('locked-id', user)).to.be.true;
			});
		});
	});

	describe('revokeInvite', () => {
		const room = createFakeRoom({ _id: 'room-id', t: 'c' });
		const user = createFakeUser({ _id: 'invitee-id' });

		it('notifies the removal of the revoked invitation', async () => {
			const invitation = createFakeSubscription({ rid: 'room-id', status: 'INVITED' });
			Subscriptions.removeInvitedByRoomIdAndUserId.resolves(invitation);

			await service.revokeInvite(room, user);

			expect(Subscriptions.removeInvitedByRoomIdAndUserId.calledOnceWithExactly('room-id', 'invitee-id')).to.be.true;
			expect(notifyOnSubscriptionChanged.calledOnceWithExactly(invitation, 'removed')).to.be.true;
		});

		it('notifies nothing when there was no invitation to revoke', async () => {
			Subscriptions.removeInvitedByRoomIdAndUserId.resolves(null);

			await service.revokeInvite(room, user);

			expect(notifyOnSubscriptionChanged.notCalled).to.be.true;
		});
	});

	describe('unbanAndInviteUser', () => {
		const subscription = createFakeSubscription({ _id: 'sub-id', rid: 'room-id' });
		const inviter = { _id: 'inviter-id', username: 'inviter', name: 'The Inviter' };

		it('turns the ban into an invitation and announces it in the room', async () => {
			const invitee = { _id: 'invitee-id', username: 'invitee', name: 'The Invitee' };

			await service.unbanAndInviteUser(subscription, invitee, inviter);

			expect(Subscriptions.unbanToInvitedById.calledOnceWithExactly('sub-id', inviter)).to.be.true;
			expect(notifyOnSubscriptionChangedById.calledOnceWithExactly('sub-id', 'updated')).to.be.true;
			expect(
				Message.saveSystemMessage.calledOnceWithExactly('ui', 'room-id', 'invitee', invitee, {
					u: { _id: 'inviter-id', username: 'inviter' },
				}),
			).to.be.true;
		});

		it('notifies the update only once the subscription is written', async () => {
			let finishWrite!: () => void;
			Subscriptions.unbanToInvitedById.returns(
				new Promise<void>((resolve) => {
					finishWrite = resolve;
				}),
			);

			const pending = service.unbanAndInviteUser(subscription, { _id: 'invitee-id', username: 'invitee' }, inviter);
			await new Promise(setImmediate);

			expect(notifyOnSubscriptionChangedById.notCalled).to.be.true;

			finishWrite();
			await pending;

			expect(notifyOnSubscriptionChangedById.calledOnceWithExactly('sub-id', 'updated')).to.be.true;
		});

		it('skips the announcement when the invitee has no username', async () => {
			await service.unbanAndInviteUser(subscription, { _id: 'invitee-id' }, inviter);

			expect(Subscriptions.unbanToInvitedById.calledOnce).to.be.true;
			expect(notifyOnSubscriptionChangedById.calledOnce).to.be.true;
			expect(Message.saveSystemMessage.notCalled).to.be.true;
		});
	});

	describe('addUserRoleRoomScoped', () => {
		const subscriptionWith = (sub: Partial<ISubscription> | null) => ({ next: async () => sub });

		const expectOnlyRoleChange = (method?: sinon.SinonStub) => {
			Object.values(roleMethods)
				.filter((roleMethod) => roleMethod !== method)
				.forEach((roleMethod) => expect(roleMethod.notCalled).to.be.true);
			if (method) {
				expect(method.calledOnceWithExactly('from-id', 'room-id', 'user-id')).to.be.true;
			}
		};

		(
			[
				['moderator', roleMethods.addRoomModerator],
				['owner', roleMethods.addRoomOwner],
				['leader', roleMethods.addRoomLeader],
			] as const
		).forEach(([role, method]) => {
			it(`grants the ${role} role`, async () => {
				await service.addUserRoleRoomScoped('from-id', 'user-id', 'room-id', role);

				expectOnlyRoleChange(method);
				expect(Subscriptions.findByUserIdAndRoomIds.notCalled).to.be.true;
			});
		});

		it('rejects demoting a user who is not in the room', async () => {
			Subscriptions.findByUserIdAndRoomIds.returns(subscriptionWith(null));

			await expect(service.addUserRoleRoomScoped('from-id', 'user-id', 'room-id', 'user')).to.be.rejectedWith(
				'user and room subsciption not found',
			);

			expect(Subscriptions.findByUserIdAndRoomIds.calledOnceWithExactly('user-id', ['room-id'], { projection: { roles: 1 } })).to.be.true;
			expectOnlyRoleChange();
		});

		it('treats a member without room roles as already being a regular user', async () => {
			Subscriptions.findByUserIdAndRoomIds.returns(subscriptionWith({ _id: 'sub-id' }));

			await service.addUserRoleRoomScoped('from-id', 'user-id', 'room-id', 'user');

			expectOnlyRoleChange();
		});

		(
			[
				['owner', roleMethods.removeRoomOwner],
				['leader', roleMethods.removeRoomLeader],
				['moderator', roleMethods.removeRoomModerator],
			] as const
		).forEach(([role, method]) => {
			it(`revokes the ${role} role when demoting to a regular user`, async () => {
				Subscriptions.findByUserIdAndRoomIds.returns(subscriptionWith({ _id: 'sub-id', roles: [role] }));

				await service.addUserRoleRoomScoped('from-id', 'user-id', 'room-id', 'user');

				expectOnlyRoleChange(method);
			});
		});
	});

	describe('createUserSubscription', () => {
		const ts = new Date('2026-01-01T00:00:00.000Z');
		const room = createFakeRoom({ _id: 'room-id', t: 'c' });
		const userToBeAdded = createFakeUser({ _id: 'new-id', username: 'newbie' });
		const inviter = { _id: 'inviter-id', username: 'inviter', name: 'The Inviter' };
		const baseSubscription = { ts, open: true, alert: true, unread: 1, userMentions: 1, groupMentions: 0 };

		beforeEach(() => {
			Subscriptions.createWithRoomAndUser.resolves({ insertedId: 'sub-id' });
		});

		(
			[
				['a visible subscription that alerts', {}, { open: true, alert: true }],
				['a visible subscription without alert when the sound is skipped', { skipAlertSound: true }, { open: true, alert: false }],
				['a hidden subscription that never alerts', { createAsHidden: true }, { open: false, alert: false }],
			] as const
		).forEach(([description, options, visibility]) => {
			it(`creates ${description}`, async () => {
				await service.createUserSubscription({ room, ts, userToBeAdded, skipSystemMessage: true, ...options });

				const expected = { ...baseSubscription, ...visibility };
				expect(Subscriptions.createWithRoomAndUser.calledOnceWithExactly(room, userToBeAdded, expected)).to.be.true;
			});
		});

		it('records the roles, invitation status and inviter', async () => {
			await service.createUserSubscription({
				room,
				ts,
				userToBeAdded,
				inviter,
				roles: ['owner'],
				status: 'INVITED',
				skipSystemMessage: true,
			});

			expect(
				Subscriptions.createWithRoomAndUser.calledOnceWithExactly(room, userToBeAdded, {
					...baseSubscription,
					roles: ['owner'],
					status: 'INVITED',
					inviter: { _id: 'inviter-id', username: 'inviter', name: 'The Inviter' },
				}),
			).to.be.true;
		});

		describe('direct messages', () => {
			const dm = createFakeRoom({ _id: 'dm-id', t: 'd' });

			it('names the subscription after the inviter', async () => {
				await service.createUserSubscription({ room: dm, ts, userToBeAdded, inviter, skipSystemMessage: true });

				expect(
					Subscriptions.createWithRoomAndUser.calledOnceWithExactly(dm, userToBeAdded, {
						...baseSubscription,
						inviter,
						fname: 'The Inviter',
						name: 'inviter',
					}),
				).to.be.true;
			});

			it('falls back to the inviter username as the display name', async () => {
				await service.createUserSubscription({
					room: dm,
					ts,
					userToBeAdded,
					inviter: { _id: 'inviter-id', username: 'inviter' },
					skipSystemMessage: true,
				});

				expect(
					Subscriptions.createWithRoomAndUser.calledOnceWithExactly(dm, userToBeAdded, {
						...baseSubscription,
						inviter: { _id: 'inviter-id', username: 'inviter' },
						fname: 'inviter',
						name: 'inviter',
					}),
				).to.be.true;
			});
		});

		it('notifies the inserted subscription and returns its id', async () => {
			expect(await service.createUserSubscription({ room, ts, userToBeAdded, skipSystemMessage: true })).to.equal('sub-id');
			expect(notifyOnSubscriptionChangedById.calledOnceWithExactly('sub-id', 'inserted')).to.be.true;
		});

		it('notifies nothing when no subscription was inserted', async () => {
			Subscriptions.createWithRoomAndUser.resolves({ insertedId: undefined });

			expect(await service.createUserSubscription({ room, ts, userToBeAdded, skipSystemMessage: true })).to.be.undefined;
			expect(notifyOnSubscriptionChangedById.notCalled).to.be.true;
		});

		describe('system messages', () => {
			it('posts none when asked to skip it', async () => {
				await service.createUserSubscription({ room, ts, userToBeAdded, inviter, skipSystemMessage: true });

				expect(Message.saveSystemMessage.notCalled).to.be.true;
			});

			it('posts none for a user without a username', async () => {
				await service.createUserSubscription({ room, ts, userToBeAdded: createFakeUser({ username: undefined }), inviter });

				expect(Subscriptions.createWithRoomAndUser.calledOnce).to.be.true;
				expect(Message.saveSystemMessage.notCalled).to.be.true;
			});

			const byInviter = { u: { _id: 'inviter-id', username: 'inviter' } };

			(
				[
					['added-user-to-team', 'an inviter adds the user to a team', { teamMain: true }, { inviter }, { ts, ...byInviter }],
					['ui', 'an inviter invites the user', {}, { inviter, status: 'INVITED' }, byInviter],
					['au', 'an inviter adds the user', {}, { inviter }, { ts, ...byInviter }],
					['ut', 'the user joins a discussion', { prid: 'parent-id' }, {}, { ts }],
					['ujt', 'the user joins a team', { teamMain: true }, {}, { ts }],
					['uj', 'the user joins a room', {}, {}, { ts }],
				] as const
			).forEach(([type, description, roomOverrides, options, extraData]) => {
				it(`posts "${type}" when ${description}`, async () => {
					const target = createFakeRoom({ _id: 'target-id', t: 'c', ...roomOverrides });

					await service.createUserSubscription({ room: target, ts, userToBeAdded, ...options });

					expect(Message.saveSystemMessage.calledOnceWithExactly(type, 'target-id', 'newbie', userToBeAdded, extraData)).to.be.true;
				});
			});
		});
	});

	describe('saveRoomName', () => {
		it('rejects an acting user that does not exist', async () => {
			Users.findOneById.resolves(null);

			await expect(service.saveRoomName('room-id', 'user-id', 'new-name')).to.be.rejectedWith('User not found');

			expect(Users.findOneById.calledOnceWithExactly('user-id')).to.be.true;
			expect(saveRoomName.notCalled).to.be.true;
		});

		it('renames the room as the acting user', async () => {
			const user = createFakeUser({ _id: 'user-id' });
			Users.findOneById.withArgs('user-id').resolves(user);

			await service.saveRoomName('room-id', 'user-id', 'new-name');

			expect(saveRoomName.calledOnceWithExactly('room-id', 'new-name', user)).to.be.true;
		});
	});

	describe('read state', () => {
		const room = createFakeRoom({ t: 'c' });
		const user = createFakeUser();

		it('marks the room as read without its threads by default', async () => {
			await service.markAsRead(room, 'user-id');

			expect(readMessages.calledOnceWithExactly(room, 'user-id', false)).to.be.true;
		});

		it('marks the room and its threads as read when asked', async () => {
			await service.markAsRead(room, 'user-id', true);

			expect(readMessages.calledOnceWithExactly(room, 'user-id', true)).to.be.true;
		});

		it('marks a thread as read', async () => {
			await service.readThread({ user, room, tmid: 'thread-id' });

			expect(readThread.calledOnceWithExactly({ user, room, tmid: 'thread-id' })).to.be.true;
		});
	});
});
