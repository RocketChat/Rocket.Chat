import { Authorization, Settings } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

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
