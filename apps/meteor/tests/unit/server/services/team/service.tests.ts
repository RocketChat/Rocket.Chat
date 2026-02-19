import { expect } from 'chai';
import { describe, it } from 'mocha';
import proxyquire from 'proxyquire';
import sinon from 'sinon';

const createTeamService = (deps: { Rooms: any; Users: any; addUserToRoom: sinon.SinonStub }) => {
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
			Rooms: deps.Rooms,
			Subscriptions: {},
			Users: deps.Users,
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
			addUserToRoom: deps.addUserToRoom,
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

	return new TeamService();
};

describe('Team service', () => {
	it('should wait for default room membership operations to finish', async function () {
		this.timeout(15000);

		const addUserToRoom = sinon.stub();
		let secondCallResolved = false;

		addUserToRoom.onFirstCall().resolves(true);
		addUserToRoom.onSecondCall().returns(
			new Promise<void>((resolve) => {
				setTimeout(() => {
					secondCallResolved = true;
					resolve();
				}, 20);
			}),
		);

		const Rooms = {
			findDefaultRoomsForTeam: sinon.stub().returns({
				toArray: () => Promise.resolve([{ _id: 'default-room' }]),
			}),
		};

		const Users = {
			findActiveByIds: sinon.stub().returns({
				toArray: () =>
					Promise.resolve([
						{ _id: 'user-1', username: 'user-1' },
						{ _id: 'user-2', username: 'user-2' },
					]),
			}),
		};

		const service = createTeamService({ Rooms, Users, addUserToRoom });

		await service.addMembersToDefaultRooms({ _id: 'inviter', username: 'inviter' }, 'team-id', [
			{ userId: 'user-1' },
			{ userId: 'user-2' },
		]);

		expect(secondCallResolved).to.be.true;
		expect(addUserToRoom.callCount).to.equal(2);
	});

	it('should propagate errors from default room membership operations', async function () {
		this.timeout(15000);

		const addUserToRoom = sinon.stub().rejects(new Error('room-add-failed'));
		const Rooms = {
			findDefaultRoomsForTeam: sinon.stub().returns({
				toArray: () => Promise.resolve([{ _id: 'default-room' }]),
			}),
		};
		const Users = {
			findActiveByIds: sinon.stub().returns({
				toArray: () => Promise.resolve([{ _id: 'user-1', username: 'user-1' }]),
			}),
		};

		const service = createTeamService({ Rooms, Users, addUserToRoom });

		let thrown: unknown;
		try {
			await service.addMembersToDefaultRooms({ _id: 'inviter', username: 'inviter' }, 'team-id', [{ userId: 'user-1' }]);
		} catch (error) {
			thrown = error;
		}

		expect(addUserToRoom.callCount).to.equal(1);
		expect(thrown).to.be.instanceOf(Error);
		expect((thrown as Error).message).to.equal('room-add-failed');
	});
});
