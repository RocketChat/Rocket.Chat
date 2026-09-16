import type { IRoom, VideoConference } from '@rocket.chat/core-typings';
import { registerModel } from '@rocket.chat/models';

import { Authorization } from './Authorization';
import { canAccessRoom } from './canAccessRoom';

jest.mock('./canAccessRoom', () => ({ canAccessRoom: jest.fn() }));
jest.mock('./canReadRoom', () => ({ canReadRoom: jest.fn() }));
jest.mock('./canAccessRoomLivechat', () => ({}));
jest.mock('./AuthorizationUtils', () => ({
	AuthorizationUtils: {
		addRolePermissionWhiteList: jest.fn(),
		isPermissionRestrictedForRoleList: jest.fn().mockReturnValue(false),
	},
}));

const canAccessRoomMock = jest.mocked(canAccessRoom);

const roomsModel = { findOneById: jest.fn(), findByIds: jest.fn() };

registerModel('IRoomsModel', roomsModel as any);

type Call = Pick<VideoConference, 'rid' | 'discussionRid' | 'users'>;

const user = { _id: 'user-id', username: 'john.doe', roles: ['user'] };

const room = (_id: IRoom['_id']): Pick<IRoom, '_id' | 't'> => ({ _id, t: 'c' });

const cursorOf = (rooms: unknown[]) => ({ toArray: jest.fn().mockResolvedValue(rooms) });

describe('Authorization service', () => {
	let service: Authorization;

	beforeEach(() => {
		jest.resetAllMocks();
		canAccessRoomMock.mockResolvedValue(true);
		service = new Authorization();
	});

	describe('canAccessRoomIds', () => {
		it('should return true when every room is accessible', async () => {
			roomsModel.findByIds.mockReturnValue(cursorOf([room('rid-1'), room('rid-2')]));

			expect(await service.canAccessRoomIds(['rid-1', 'rid-2'], user)).toBe(true);
			expect(canAccessRoomMock).toHaveBeenCalledTimes(2);
		});

		it('should return false when a single room is not accessible', async () => {
			roomsModel.findByIds.mockReturnValue(cursorOf([room('rid-1'), room('rid-2')]));
			canAccessRoomMock.mockImplementation(async (r) => r?._id !== 'rid-2');

			expect(await service.canAccessRoomIds(['rid-1', 'rid-2'], user)).toBe(false);
		});

		it('should forward the given user to each room check', async () => {
			roomsModel.findByIds.mockReturnValue(cursorOf([room('rid-1')]));

			await service.canAccessRoomIds(['rid-1'], user);

			expect(canAccessRoomMock).toHaveBeenCalledTimes(1);
			expect(canAccessRoomMock).toHaveBeenCalledWith(expect.objectContaining({ _id: 'rid-1' }), user);
		});

		it('should deduplicate the given ids before querying', async () => {
			roomsModel.findByIds.mockReturnValue(cursorOf([room('rid-1')]));

			expect(await service.canAccessRoomIds(['rid-1', 'rid-1', 'rid-1'], user)).toBe(true);
			expect(roomsModel.findByIds).toHaveBeenCalledTimes(1);
			expect(roomsModel.findByIds.mock.calls[0][0]).toEqual(['rid-1']);
			expect(canAccessRoomMock).toHaveBeenCalledTimes(1);
		});

		it('should return false when the list is empty', async () => {
			expect(await service.canAccessRoomIds([], user)).toBe(false);
			expect(roomsModel.findByIds).not.toHaveBeenCalled();
		});

		it('should return false when no user is given', async () => {
			expect(await service.canAccessRoomIds(['rid-1'], undefined as any)).toBe(false);
			expect(roomsModel.findByIds).not.toHaveBeenCalled();
		});

		it('should return false when any id does not resolve to a room', async () => {
			roomsModel.findByIds.mockReturnValue(cursorOf([room('rid-1')]));

			expect(await service.canAccessRoomIds(['rid-1', 'does-not-exist'], user)).toBe(false);
			expect(canAccessRoomMock).not.toHaveBeenCalled();
		});

		it('should query only the attributes the room access validators need', async () => {
			roomsModel.findByIds.mockReturnValue(cursorOf([room('rid-1')]));

			await service.canAccessRoomIds(['rid-1'], user);

			expect(roomsModel.findByIds.mock.calls[0][1]).toEqual({
				projection: { _id: 1, t: 1, teamId: 1, prid: 1, abacAttributes: 1 },
			});
		});
	});

	describe('canAccessConference', () => {
		const callWith = (memberIds: string[], overrides: Partial<Call> = {}): Call =>
			({
				rid: 'rid-1',
				users: memberIds.map((_id) => ({ _id })),
				...overrides,
			}) as Call;

		beforeEach(() => {
			roomsModel.findOneById.mockImplementation(async (rid: IRoom['_id']) => room(rid));
			canAccessRoomMock.mockResolvedValue(false);
		});

		// The regression: someone added to a DM call from outside has no subscription to the DM, so checking the room
		// instead of the membership refused them their own call.
		it('should admit a member who has no access to the call’s room', async () => {
			expect(await service.canAccessConference(callWith(['dm-one', 'dm-two', 'added']), 'added')).toBe(true);
			// membership settles it without asking about the room
			expect(roomsModel.findOneById).not.toHaveBeenCalled();
		});

		it('should admit someone who can see the room the call started in', async () => {
			canAccessRoomMock.mockImplementation(async (r, u) => r?._id === 'rid-1' && u?._id === 'onlooker');

			expect(await service.canAccessConference(callWith(['host']), 'onlooker')).toBe(true);
		});

		// A conference's chat can move to a discussion whose members cannot see the parent room, so it is its own way in.
		it('should admit someone who can see the discussion the chat moved to', async () => {
			canAccessRoomMock.mockImplementation(async (r, u) => r?._id === 'discussion-1' && u?._id === 'discussion-member');

			expect(await service.canAccessConference(callWith(['host'], { discussionRid: 'discussion-1' }), 'discussion-member')).toBe(true);
		});

		it('should refuse a stranger', async () => {
			expect(await service.canAccessConference(callWith(['host']), 'stranger')).toBe(false);
		});

		it('should refuse anyone not signed in', async () => {
			expect(await service.canAccessConference(callWith(['host']), undefined)).toBe(false);
			expect(roomsModel.findOneById).not.toHaveBeenCalled();
		});
	});
});
