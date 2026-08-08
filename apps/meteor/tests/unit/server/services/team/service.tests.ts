import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const Rooms = {
	findDefaultRoomsForTeam: sinon.stub(),
	findPaginatedByTeamIdContainingNameAndDefault: sinon.stub(),
};

const Users = {
	findActiveByIds: sinon.stub(),
	findOneById: sinon.stub(),
};

const Team = {
	findOneById: sinon.stub(),
};

const TeamMember = {
	findOneByUserIdAndTeamId: sinon.stub(),
};

const addUserToRoom = sinon.stub();

const { TeamService } = proxyquire.noCallThru().load('../../../../../server/services/team/service', {
	'@rocket.chat/core-services': {
		Room: {},
		Authorization: {},
		Message: {},
		ServiceClassInternal: class {},
		api: {},
	},
	'@rocket.chat/core-typings': {
		TeamType: { PUBLIC: 0, PRIVATE: 1 },
	},
	'@rocket.chat/models': {
		Team,
		Rooms,
		Subscriptions: {},
		Users,
		TeamMember,
	},
	'@rocket.chat/string-helpers': {
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
		Rooms.findPaginatedByTeamIdContainingNameAndDefault.reset();
		Team.findOneById.reset();
		TeamMember.findOneByUserIdAndTeamId.reset();
		Users.findActiveByIds.reset();
		Users.findOneById.reset();
	});

	it('should trim the room name without shifting member filters or pagination', async () => {
		Team.findOneById.resolves({ _id: 'team-id', type: 0 });
		TeamMember.findOneByUserIdAndTeamId.resolves(undefined);
		Users.findOneById.resolves({ __rooms: ['room-id'] });
		Rooms.findPaginatedByTeamIdContainingNameAndDefault.returns({
			cursor: { toArray: sinon.stub().resolves([]) },
			totalCount: Promise.resolve(0),
		});

		await service.listRooms(
			'user-id',
			'team-id',
			{ name: '  general  ', isDefault: false, getAllRooms: false, allowPrivateTeam: false },
			{ offset: 5, count: 10 },
		);

		expect(
			Rooms.findPaginatedByTeamIdContainingNameAndDefault.calledOnceWithExactly('team-id', 'general', false, ['room-id'], {
				skip: 5,
				limit: 10,
			}),
		).to.equal(true);
	});

	it('should trim the room name without shifting all-room filters or pagination', async () => {
		Team.findOneById.resolves({ _id: 'team-id', type: 0 });
		TeamMember.findOneByUserIdAndTeamId.resolves(undefined);
		Rooms.findPaginatedByTeamIdContainingNameAndDefault.returns({
			cursor: { toArray: sinon.stub().resolves([]) },
			totalCount: Promise.resolve(0),
		});

		await service.listRooms(
			'user-id',
			'team-id',
			{ name: '  general  ', isDefault: true, getAllRooms: true, allowPrivateTeam: false },
			{ offset: 15, count: 20 },
		);

		expect(
			Rooms.findPaginatedByTeamIdContainingNameAndDefault.calledOnceWithExactly('team-id', 'general', true, undefined, {
				skip: 15,
				limit: 20,
			}),
		).to.equal(true);
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
});
