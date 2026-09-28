import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const Rooms = {
	findDefaultRoomsForTeam: sinon.stub(),
	findOneById: sinon.stub(),
	unsetTeamId: sinon.stub(),
};

const Users = {
	findActiveByIds: sinon.stub(),
};

const Message = {
	saveSystemMessage: sinon.stub(),
};

const addUserToRoom = sinon.stub();

const { TeamService } = proxyquire.noCallThru().load('../../../../../server/services/team/service', {
	'@rocket.chat/core-services': {
		Room: {},
		Authorization: {},
		Message,
		ServiceClassInternal: class {},
		api: {},
	},
	'@rocket.chat/models': {
		Team: {},
		Rooms,
		Subscriptions: {},
		Users,
		TeamMember: {},
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
	'../../lib/users/checkUsernameAvailability': {
		checkUsernameAvailability: sinon.stub(),
	},
	'../../lib/rooms/getRoomsWithSingleOwner': {
		getSubscribedRoomsForUserWithDetails: sinon.stub(),
	},
	'../../lib/rooms/removeUserFromRoom': {
		removeUserFromRoom: sinon.stub(),
	},
	'../../lib/notifyListener': {
		notifyOnSubscriptionChangedByRoomIdAndUserId: sinon.stub(),
		notifyOnRoomChangedById: sinon.stub(),
	},
	'../../settings': {
		settings: { get: sinon.stub() },
	},
});

const service = new TeamService();

describe('Team service', () => {
	beforeEach(() => {
		addUserToRoom.reset();
		Rooms.findDefaultRoomsForTeam.reset();
		Rooms.findOneById.reset();
		Rooms.unsetTeamId.reset();
		Users.findActiveByIds.reset();
		Message.saveSystemMessage.reset();
	});

	it('should wait for default room membership operations to finish', async function () {
		this.timeout(15000);

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

	it('should propagate errors from default room membership operations', async function () {
		this.timeout(15000);

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

	describe('unsetTeamIdOfRooms', () => {
		const user = { _id: 'user-1', username: 'user-1', name: 'User One' };
		const team = { _id: 'team-id', roomId: 'team-room' };

		it('should announce the conversion on the main room and move the remaining rooms back to the workspace', async () => {
			Rooms.findOneById.resolves({ _id: 'team-room', name: 'team-room-name' });

			await service.unsetTeamIdOfRooms(user, team);

			expect(Message.saveSystemMessage.calledOnceWith('user-converted-to-channel', 'team-room', 'team-room-name', user)).to.be.true;
			expect(Rooms.unsetTeamId.calledOnceWith('team-id')).to.be.true;
		});

		it('should move the remaining rooms back to the workspace when the main room no longer exists', async () => {
			Rooms.findOneById.resolves(null);

			await service.unsetTeamIdOfRooms(user, team);

			expect(Message.saveSystemMessage.called).to.be.false;
			expect(Rooms.unsetTeamId.calledOnceWith('team-id')).to.be.true;
		});
	});
});
