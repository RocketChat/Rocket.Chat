import { expect } from 'chai';
import { beforeEach, describe, it, vi } from 'vitest';

// Stubs built in `vi.hoisted` so the hoisted `vi.mock` factories can reference them.
const {
	Rooms,
	Users,
	addUserToRoom,
	saveRoomName,
	saveRoomType,
	checkUsernameAvailability,
	getSubscribedRoomsForUserWithDetails,
	removeUserFromRoom,
	notifyOnSubscriptionChangedByRoomIdAndUserId,
	notifyOnRoomChangedById,
	settingsGet,
} = vi.hoisted(() => {
	const sinon = require('sinon');
	return {
		Rooms: { findDefaultRoomsForTeam: sinon.stub() },
		Users: { findActiveByIds: sinon.stub() },
		addUserToRoom: sinon.stub(),
		saveRoomName: sinon.stub(),
		saveRoomType: sinon.stub(),
		checkUsernameAvailability: sinon.stub(),
		getSubscribedRoomsForUserWithDetails: sinon.stub(),
		removeUserFromRoom: sinon.stub(),
		notifyOnSubscriptionChangedByRoomIdAndUserId: sinon.stub(),
		notifyOnRoomChangedById: sinon.stub(),
		settingsGet: sinon.stub(),
	};
});

vi.mock('@rocket.chat/core-services', () => ({
	Room: {},
	Authorization: {},
	Message: {},
	ServiceClassInternal: class {},
	api: {},
}));
vi.mock('@rocket.chat/models', () => ({
	Team: {},
	Rooms,
	Subscriptions: {},
	Users,
	TeamMember: {},
}));
vi.mock('@rocket.chat/string-helpers', () => ({ escapeRegExp: (value: string) => value }));
vi.mock('../../../../../app/channel-settings/server', () => ({ saveRoomName }));
vi.mock('../../../../../app/channel-settings/server/functions/saveRoomType', () => ({ saveRoomType }));
vi.mock('../../../../../app/lib/server/functions/addUserToRoom', () => ({ addUserToRoom }));
vi.mock('../../../../../app/lib/server/functions/checkUsernameAvailability', () => ({ checkUsernameAvailability }));
vi.mock('../../../../../app/lib/server/functions/getRoomsWithSingleOwner', () => ({ getSubscribedRoomsForUserWithDetails }));
vi.mock('../../../../../app/lib/server/functions/removeUserFromRoom', () => ({ removeUserFromRoom }));
vi.mock('../../../../../app/lib/server/lib/notifyListener', () => ({
	notifyOnSubscriptionChangedByRoomIdAndUserId,
	notifyOnRoomChangedById,
}));
vi.mock('../../../../../app/settings/server', () => ({ settings: { get: settingsGet } }));

const { TeamService } = await import('../../../../../server/services/team/service');

const service = new TeamService();

describe('Team service', () => {
	beforeEach(() => {
		addUserToRoom.reset();
		Rooms.findDefaultRoomsForTeam.reset();
		Users.findActiveByIds.reset();
	});

	it('should wait for default room membership operations to finish', async () => {
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
	}, 15000);

	it('should propagate errors from default room membership operations', async () => {
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
	}, 15000);
});
