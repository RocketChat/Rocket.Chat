import { Abac, Authorization, License, Settings } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { canAccessRoom } from './canAccessRoom';
import { canAccessRoomLivechat } from './canAccessRoomLivechat';

jest.mock('@rocket.chat/models', () => ({
	Subscriptions: {
		findOneBannedSubscription: jest.fn(),
		countByRoomIdAndUserId: jest.fn(),
	},
	Rooms: {
		findOneById: jest.fn(),
	},
	TeamMember: {
		findOneByUserIdAndTeamId: jest.fn(),
	},
	Team: {
		findOneById: jest.fn(),
	},
	Users: {
		findOneById: jest.fn(),
	},
}));

jest.mock('@rocket.chat/core-services', () => ({
	Authorization: {
		hasPermission: jest.fn(),
		canAccessRoom: jest.fn(),
	},
	License: {
		hasModule: jest.fn(),
	},
	Abac: {
		canAccessObject: jest.fn(),
	},
	Settings: {
		get: jest.fn(),
	},
}));

jest.mock('./canAccessRoomLivechat', () => ({
	canAccessRoomLivechat: jest.fn(),
}));

const findOneUserById = jest.mocked(Users.findOneById);
const hasPermission = jest.mocked(Authorization.hasPermission);
const getSetting = jest.mocked(Settings.get);

describe('canAccessRoom', () => {
	beforeEach(() => {
		jest.resetAllMocks();

		// sane defaults: everything denies access unless a test says otherwise
		findOneUserById.mockResolvedValue(null);
		hasPermission.mockResolvedValue(false);
		getSetting.mockResolvedValue(false);
		jest.mocked(canAccessRoomLivechat).mockResolvedValue(false);
	});

	describe('discussion privacy', () => {
		const user = { _id: 'user-id', username: 'charlie', roles: ['user'] } as IUser;
		const discussion = { _id: 'discussion-id', t: 'p' as const, prid: 'parent-id' };

		beforeEach(() => {
			jest.mocked(Subscriptions.countByRoomIdAndUserId).mockResolvedValue(0);
			jest.mocked(Authorization.canAccessRoom).mockResolvedValue(true);
			hasPermission.mockResolvedValue(true);
		});

		it.each(['c', 'p'] as const)('denies a private discussion to a nonmember with access to a %s parent', async (type) => {
			jest.mocked(Rooms.findOneById).mockResolvedValue({ _id: discussion.prid, t: type } as IRoom);

			expect(await canAccessRoom(discussion, user)).toBe(false);
			expect(Authorization.canAccessRoom).not.toHaveBeenCalled();
		});

		it('denies a private discussion to an anonymous reader of its parent', async () => {
			getSetting.mockResolvedValue(true);
			jest.mocked(Rooms.findOneById).mockResolvedValue({ _id: discussion.prid, t: 'c' } as IRoom);

			expect(await canAccessRoom(discussion, undefined)).toBe(false);
		});

		it('allows an existing member with room-view permission', async () => {
			jest.mocked(Subscriptions.countByRoomIdAndUserId).mockResolvedValue(1);

			expect(await canAccessRoom(discussion, user)).toBe(true);
			expect(Subscriptions.countByRoomIdAndUserId).toHaveBeenCalledWith(discussion._id, user._id, false);
		});

		it('does not bypass missing room-view permissions for a member', async () => {
			hasPermission.mockResolvedValue(false);
			jest.mocked(Subscriptions.countByRoomIdAndUserId).mockResolvedValue(1);
			jest.mocked(Rooms.findOneById).mockResolvedValue({ _id: discussion.prid, t: 'c' } as IRoom);

			expect(await canAccessRoom(discussion, user)).toBe(false);
		});

		it('preserves public discussion access for a nonmember', async () => {
			expect(await canAccessRoom({ ...discussion, t: 'c' }, user)).toBe(true);
		});

		it('revokes parent-based access when a public discussion becomes private', async () => {
			jest.mocked(Rooms.findOneById).mockResolvedValue({ _id: discussion.prid, t: 'c' } as IRoom);

			expect(await canAccessRoom({ ...discussion, t: 'c' }, user)).toBe(true);
			expect(await canAccessRoom(discussion, user)).toBe(false);
			expect(await canAccessRoom({ ...discussion, t: 'c' }, user)).toBe(true);
		});

		it('does not bypass an ABAC denial through the parent room', async () => {
			jest.mocked(License.hasModule).mockResolvedValue(true);
			getSetting.mockResolvedValue(true);
			jest.mocked(Abac.canAccessObject).mockResolvedValue(false);
			jest.mocked(Rooms.findOneById).mockResolvedValue({ _id: discussion.prid, t: 'c' } as IRoom);

			expect(await canAccessRoom({ ...discussion, abacAttributes: [{ key: 'department', values: ['engineering'] }] }, user)).toBe(false);
		});
	});

	describe('user hydration', () => {
		it('should hydrate a partial user before running the validators', async () => {
			const fullUser = { _id: 'user-id', username: 'john.doe', roles: ['user'] } as IUser;
			findOneUserById.mockResolvedValue(fullUser);
			hasPermission.mockResolvedValue(true);

			const result = await canAccessRoom({ _id: 'room-id', t: 'c' }, { _id: 'user-id' });

			expect(result).toBe(true);
			expect(findOneUserById).toHaveBeenCalledTimes(1);
			expect(findOneUserById).toHaveBeenCalledWith('user-id');
			expect(hasPermission).toHaveBeenCalledWith(fullUser, 'view-c-room');
		});

		it('should throw when the partial user cannot be found', async () => {
			await expect(canAccessRoom({ _id: 'room-id', t: 'c' }, { _id: 'user-id' })).rejects.toThrow('User not found');
		});

		it('should not hydrate a full user', async () => {
			await canAccessRoom({ _id: 'room-id', t: 'c' }, { _id: 'user-id', username: 'john.doe' } as IUser);

			expect(findOneUserById).not.toHaveBeenCalled();
		});

		it('should not hydrate an undefined user', async () => {
			await canAccessRoom({ _id: 'room-id', t: 'c' }, undefined);

			expect(findOneUserById).not.toHaveBeenCalled();
		});

		it('should not hydrate a user whose _id is undefined, and treat it as anonymous instead of throwing when anonymous read is on', async () => {
			getSetting.mockResolvedValue(true);

			const result = await canAccessRoom({ _id: 'room-id', t: 'c' }, { _id: undefined });

			expect(findOneUserById).not.toHaveBeenCalled();
			expect(getSetting).toHaveBeenCalledWith('Accounts_AllowAnonymousRead');
			expect(result).toBe(true);
		});

		it('should deny access to a user whose _id is undefined when anonymous read is off', async () => {
			getSetting.mockResolvedValue(false);

			const result = await canAccessRoom({ _id: 'room-id', t: 'c' }, { _id: undefined });

			expect(findOneUserById).not.toHaveBeenCalled();
			expect(result).toBe(false);
		});
	});
});
