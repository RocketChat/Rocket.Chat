import { expect } from 'chai';
import { beforeEach, describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const Rooms = {
	findDefaultRoomsForTeam: sinon.stub(),
};

const Users = {
	findActiveByIds: sinon.stub(),
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
	'@rocket.chat/models': {
		Team: {},
		Rooms,
		Subscriptions: {},
		Users,
		TeamMember: {},
	},
	'@rocket.chat/string-helpers': {
		escapeRegExp: (value: string) => value,
	},
	'../../../app/channel-settings/server': {
		saveRoomName: sinon.stub(),
	},
	'../../../app/channel-settings/server/functions/saveRoomType': {
		saveRoomType: sinon.stub(),
	},
	'../../../app/lib/server/functions/addUserToRoom': {
		addUserToRoom,
	},
	'../../../app/lib/server/functions/checkUsernameAvailability': {
		checkUsernameAvailability: sinon.stub(),
	},
	'../../../app/lib/server/functions/getRoomsWithSingleOwner': {
		getSubscribedRoomsForUserWithDetails: sinon.stub(),
	},
	'../../../app/lib/server/functions/removeUserFromRoom': {
		removeUserFromRoom: sinon.stub(),
	},
	'../../../app/lib/server/lib/notifyListener': {
		notifyOnSubscriptionChangedByRoomIdAndUserId: sinon.stub(),
		notifyOnRoomChangedById: sinon.stub(),
	},
	'../../../app/settings/server': {
		settings: { get: sinon.stub() },
	},
});

const service = new TeamService();

describe('Team service', () => {
	beforeEach(() => {
		addUserToRoom.reset();
		Rooms.findDefaultRoomsForTeam.reset();
		Users.findActiveByIds.reset();
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
