import { UserStatus } from '@rocket.chat/core-typings';
import type { Db } from 'mongodb';

import { UsersRaw } from './Users';

const findOne = jest.fn();
const findOneAndUpdate = jest.fn();
const countDocuments = jest.fn();

const users = new UsersRaw({
	collection: () => ({ findOne, findOneAndUpdate, countDocuments, createIndexes: jest.fn().mockResolvedValue(undefined) }),
} as unknown as Db);

describe('UsersRaw', () => {
	it('should return only the fields presence.status listeners read after a presence update', async () => {
		await users.updatePresenceAndStatus('alice', { status: UserStatus.ONLINE });

		expect(findOneAndUpdate.mock.calls[0][2]).toEqual({
			returnDocument: 'after',
			projection: {
				_id: 1,
				username: 1,
				name: 1,
				status: 1,
				statusText: 1,
				statusSource: 1,
				statusExpiresAt: 1,
				roles: 1,
				xmppFederation: 1,
			},
		});
	});

	it('should leave out the room lists of a user read without a projection', async () => {
		await users.findOneById('alice');

		expect(findOne.mock.calls[0][1].projection).toEqual({ __rooms: 0, roomRolePriorities: 0 });
	});

	describe('countByUsernameWithNumericSuffix', () => {
		beforeEach(() => {
			countDocuments.mockReset();
		});

		const getUsernameFilter = (): RegExp => countDocuments.mock.calls[0][0].username;

		it('should count the usernames made of the given username and a number', async () => {
			await users.countByUsernameWithNumericSuffix('john.doe');

			expect(getUsernameFilter().test('john.doe-1')).toBe(true);
			expect(getUsernameFilter().test('john.doe')).toBe(false);
		});

		it('should match the dots of the username literally', async () => {
			await users.countByUsernameWithNumericSuffix('john.doe');

			expect(getUsernameFilter().test('johnXdoe-1')).toBe(false);
		});

		it('should accept usernames with regular expression characters', async () => {
			await users.countByUsernameWithNumericSuffix('c++');

			expect(getUsernameFilter().test('c++-1')).toBe(true);
		});
	});
});
