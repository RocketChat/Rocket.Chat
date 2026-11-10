import { beforeEach, describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const logError = sinon.stub();
const Rooms = {
	find: sinon.stub(),
	findOneByName: sinon.stub(),
	setTeamMainById: sinon.stub(),
	findDefaultRoomsForTeam: sinon.stub(),
	findOneById: sinon.stub(),
	detachOneRoomFromTeam: sinon.stub(),
};

const Users = {
	findOneById: sinon.stub(),
	findActiveByIdsOrUsernames: sinon.stub(),
	findActiveByIds: sinon.stub(),
};

const Message = {
	saveSystemMessage: sinon.stub(),
};

const Room = { create: sinon.stub() };

const Team = { insertOne: sinon.stub(), updateMainRoomForTeam: sinon.stub() };

const TeamMember = { insertMany: sinon.stub() };

const checkUsernameAvailability = sinon.stub();

const addUserToRoom = sinon.stub();
const notifyOnRoomChangedById = sinon.stub();

const filterDefaultChannelsForUser = sinon.stub();

const { TeamService } = proxyquire.noCallThru().load('./service', {
	'@rocket.chat/core-services': {
		Room,
		Authorization: {},
		Message,
		ServiceClassInternal: class {},
		api: {},
	},
	'@rocket.chat/models': {
		Team,
		Rooms,
		Subscriptions: {},
		Users,
		TeamMember,
	},
	'@rocket.chat/tools': {
		escapeRegExp: (value: string) => value,
	},
	'../../lib/rooms/settings': {
		saveRoomName: sinon.stub(),
	},
	'../../lib/rooms/settings/saveRoomType': {
		saveRoomType: sinon.stub(),
	},
	'../../lib/rooms/addUserToRoom': {
		addUserToRoom,
	},
	'../../lib/rooms/filterDefaultChannelsForUser': {
		filterDefaultChannelsForUser,
	},
	'../../lib/users/checkUsernameAvailability': {
		checkUsernameAvailability,
	},
	'../../lib/rooms/getRoomsWithSingleOwner': {
		getSubscribedRoomsForUserWithDetails: sinon.stub(),
	},
	'../../lib/rooms/removeUserFromRoom': {
		removeUserFromRoom: sinon.stub(),
	},
	'../../lib/notifyListener': {
		notifyOnSubscriptionChangedByRoomIdAndUserId: sinon.stub(),
		notifyOnRoomChangedById,
	},
	'../../settings': {
		settings: { get: sinon.stub() },
	},
	'@rocket.chat/logger': {
		Logger: class {
			error = logError;
		},
	},
});

const service = new TeamService();

describe('Team service', () => {
	beforeEach(() => {
		Rooms.find.reset();
		Rooms.find.returns({
			toArray: async () => [],
		});
		notifyOnRoomChangedById.reset();
		notifyOnRoomChangedById.resolves();
		addUserToRoom.reset();
		Rooms.findDefaultRoomsForTeam.reset();
		Rooms.findOneById.reset();
		Rooms.detachOneRoomFromTeam.reset();
		Rooms.detachOneRoomFromTeam.resolves(null);
		Users.findActiveByIds.reset();
		Message.saveSystemMessage.reset();
		filterDefaultChannelsForUser.reset();
		filterDefaultChannelsForUser.callsFake((rooms: unknown[]) => Promise.resolve(rooms));
		logError.reset();
	});

	it('should not forward client room options to room creation', async () => {
		checkUsernameAvailability.resolves(true);
		Rooms.findOneByName.resolves(null);
		Users.findOneById.resolves({ _id: 'caller', username: 'caller' });
		Room.create.resolves({ _id: 'room-id' });
		Team.insertOne.resolves({ insertedId: 'team-id' });

		await service.create('caller', {
			team: { name: 'team', type: 0 },
			room: { name: 'team', options: { app: { _id: 'spoofed', name: 'Spoofed' } } } as any,
		});

		expect(Room.create.calledOnce).to.equal(true);
		expect(Room.create.firstCall.args[1]).to.not.have.property('options');
	});

	it('should wait for default room membership operations to finish', { timeout: 15000 }, async () => {
		addUserToRoom.onFirstCall().resolves(true);
		addUserToRoom.onSecondCall().returns(
			new Promise<void>((resolve) => {
				setTimeout(() => {
					resolve();
				}, 20);
			}),
		);

		Rooms.findDefaultRoomsForTeam.returns({
			toArray: () => Promise.resolve([{ _id: 'default-room' }]),
		});
		Users.findActiveByIds.returns({
			toArray: () =>
				Promise.resolve([
					{ _id: 'user-1', username: 'user-1' },
					{ _id: 'user-2', username: 'user-2' },
				]),
		});

		await service.addMembersToDefaultRooms({ _id: 'inviter', username: 'inviter' }, 'team-id', [
			{ userId: 'user-1' },
			{ userId: 'user-2' },
		]);

		expect(addUserToRoom.callCount).to.equal(2);
	});

	it('should propagate errors from default room membership operations', { timeout: 15000 }, async () => {
		addUserToRoom.rejects(new Error('room-add-failed'));
		Rooms.findDefaultRoomsForTeam.returns({
			toArray: () => Promise.resolve([{ _id: 'default-room' }]),
		});
		Users.findActiveByIds.returns({
			toArray: () => Promise.resolve([{ _id: 'user-1', username: 'user-1' }]),
		});

		await expect(
			service.addMembersToDefaultRooms({ _id: 'inviter', username: 'inviter' }, 'team-id', [{ userId: 'user-1' }]),
		).to.be.rejectedWith('room-add-failed');

		expect(addUserToRoom.callCount).to.equal(1);
	});

	it('should leave out the default rooms the user is not allowed to join', async () => {
		const allowedRoom = { _id: 'allowed-room' };
		const refusedRoom = { _id: 'refused-room' };

		addUserToRoom.resolves(true);
		Rooms.findDefaultRoomsForTeam.returns({
			toArray: () => Promise.resolve([allowedRoom, refusedRoom]),
		});
		Users.findActiveByIds.returns({
			toArray: () => Promise.resolve([{ _id: 'user-1', username: 'user-1' }]),
		});
		filterDefaultChannelsForUser.resolves([allowedRoom]);

		await service.addMembersToDefaultRooms({ _id: 'inviter', username: 'inviter' }, 'team-id', [{ userId: 'user-1' }]);

		expect(addUserToRoom.callCount).to.equal(1);
		expect(addUserToRoom.firstCall.args[0]).to.equal('allowed-room');
	});

	it('should filter the default rooms without refreshing the member attributes or auditing the grant', async () => {
		Rooms.findDefaultRoomsForTeam.returns({
			toArray: () => Promise.resolve([{ _id: 'default-room' }]),
		});
		Users.findActiveByIds.returns({
			toArray: () => Promise.resolve([{ _id: 'user-1', username: 'user-1' }]),
		});

		await service.addMembersToDefaultRooms({ _id: 'inviter', username: 'inviter' }, 'team-id', [{ userId: 'user-1' }]);

		expect(filterDefaultChannelsForUser.calledOnce).to.be.true;
		expect(filterDefaultChannelsForUser.firstCall.args[2]?.refreshUserAttributes).to.not.be.true;
		expect(filterDefaultChannelsForUser.firstCall.args[2]?.audit).to.equal(false);
	});

	describe('unsetTeamIdOfRooms', () => {
		const user = { _id: 'user-1', username: 'user-1', name: 'User One' };
		const team = { _id: 'team-id', roomId: 'team-room' };
		it('should detach rooms concurrently and wait for the batch before notifying', async () => {
			const detach = Rooms.detachOneRoomFromTeam;

			let finishFirst: (room: { _id: string }) => void = () => undefined;
			const firstResult = new Promise<{ _id: string }>((resolve) => {
				finishFirst = resolve;
			});

			let markBatchStarted: () => void = () => undefined;
			const batchStarted = new Promise<void>((resolve) => {
				markBatchStarted = resolve;
			});

			detach.onFirstCall().returns(firstResult);
			detach.onCall(5).resolves({ _id: 'late-room' });
			detach.onCall(4).callsFake(async () => {
				markBatchStarted();
				return null;
			});

			const conversion = service.unsetTeamIdOfRooms(user, team);
			await batchStarted;

			// Five operations have started while the first is still pending.
			expect(detach.callCount).to.equal(5);
			sinon.assert.notCalled(notifyOnRoomChangedById);

			finishFirst({ _id: team.roomId });
			await conversion;

			// A third, empty batch confirms there are no remaining rooms.
			expect(detach.callCount).to.equal(15);
			sinon.assert.alwaysCalledWithExactly(detach, team._id);
			sinon.assert.calledOnceWithExactly(notifyOnRoomChangedById, [team.roomId, 'late-room'], 'updated');
		});

		it('should log a notification failure and allow cleanup to continue', async () => {
			const error = new Error('notification-failed');
			Rooms.detachOneRoomFromTeam.onFirstCall().resolves({ _id: team.roomId });
			notifyOnRoomChangedById.rejects(error);

			await service.unsetTeamIdOfRooms(user, team);
			expect(Rooms.detachOneRoomFromTeam.callCount).to.equal(10);
			sinon.assert.alwaysCalledWithExactly(Rooms.detachOneRoomFromTeam, team._id);

			sinon.assert.calledOnceWithExactly(notifyOnRoomChangedById, [team.roomId], 'updated');
			sinon.assert.calledOnceWithExactly(logError, {
				msg: 'Failed to notify room changes after removing team associations',
				teamId: team._id,
				err: error,
			});
		});

		it('should propagate a database failure without notifying clients', async () => {
			Rooms.detachOneRoomFromTeam.rejects(new Error('database-update-failed'));

			await expect(service.unsetTeamIdOfRooms(user, team)).to.be.rejectedWith('database-update-failed');

			sinon.assert.notCalled(notifyOnRoomChangedById);
			sinon.assert.notCalled(logError);
		});

		it('should notify successful detachments even when another operation in the batch fails', async () => {
			const detach = Rooms.detachOneRoomFromTeam;
			const error = new Error('database-update-failed');

			let finishDetach: (room: { _id: string }) => void = () => undefined;
			const pendingDetach = new Promise<{ _id: string }>((resolve) => {
				finishDetach = resolve;
			});

			let markFailure: () => void = () => undefined;
			const failureReached = new Promise<void>((resolve) => {
				markFailure = resolve;
			});

			detach.onFirstCall().returns(pendingDetach);
			detach.onSecondCall().callsFake(async () => {
				markFailure();
				throw error;
			});

			const conversion = service.unsetTeamIdOfRooms(user, team);
			const rejection = expect(conversion).to.be.rejectedWith('database-update-failed');

			await failureReached;
			sinon.assert.notCalled(notifyOnRoomChangedById);

			// This operation succeeds after another operation has failed.
			finishDetach({ _id: team.roomId });
			await rejection;

			expect(detach.callCount).to.equal(5);
			sinon.assert.alwaysCalledWithExactly(detach, team._id);
			sinon.assert.calledOnceWithExactly(notifyOnRoomChangedById, [team.roomId], 'updated');
		});

		it('should announce the conversion on the main room and move the remaining rooms back to the workspace', async () => {
			Rooms.findOneById.resolves({ _id: 'team-room', name: 'team-room-name' });

			await service.unsetTeamIdOfRooms(user, team);

			expect(Message.saveSystemMessage.calledOnceWith('user-converted-to-channel', 'team-room', 'team-room-name', user)).to.be.true;
			expect(Rooms.detachOneRoomFromTeam.callCount).to.equal(5);
			sinon.assert.alwaysCalledWithExactly(Rooms.detachOneRoomFromTeam, team._id);
		});

		it('should move the remaining rooms back to the workspace when the main room no longer exists', async () => {
			Rooms.findOneById.resolves(null);

			await service.unsetTeamIdOfRooms(user, team);

			expect(Message.saveSystemMessage.called).to.be.false;
			expect(Rooms.detachOneRoomFromTeam.callCount).to.equal(5);
			sinon.assert.alwaysCalledWithExactly(Rooms.detachOneRoomFromTeam, team._id);
		});
	});
});
