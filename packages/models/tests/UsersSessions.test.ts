import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import type { Collection, Db, UpdateResult } from 'mongodb';

import { UsersSessionsRaw } from '../src/models/UsersSessions';

describe('UsersSessionsRaw', () => {
	let usersSessionsRaw: UsersSessionsRaw;
	let mockCollection: jest.Mocked<Collection>;
	let mockDb: jest.Mocked<Db>;

	beforeEach(() => {
		mockCollection = {
			updateOne: jest.fn(),
			updateMany: jest.fn(),
			find: jest.fn(),
		} as any;

		mockDb = {
			collection: jest.fn(() => mockCollection),
		} as any;

		usersSessionsRaw = new UsersSessionsRaw(mockDb);
	});

	describe('updateConnectionStatusById', () => {
		test('should update connection status and _updatedAt when status is provided', async () => {
			const mockResult: UpdateResult = {
				acknowledged: true,
				matchedCount: 1,
				modifiedCount: 1,
				upsertedCount: 0,
				upsertedId: null,
			};

			mockCollection.updateOne.mockResolvedValue(mockResult);

			const result = await usersSessionsRaw.updateConnectionStatusById('user123', 'conn456', 'online');

			expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);
			const [query, update] = mockCollection.updateOne.mock.calls[0];

			expect(query).toEqual({
				'_id': 'user123',
				'connections.id': 'conn456',
			});

			expect(update.$set).toHaveProperty('connections.$.status', 'online');
			expect(update.$set).toHaveProperty('connections.$._updatedAt');
			expect(update.$set['connections.$._updatedAt']).toBeInstanceOf(Date);

			expect(result).toEqual(mockResult);
		});

		test('should update only _updatedAt when status is undefined', async () => {
			const mockResult: UpdateResult = {
				acknowledged: true,
				matchedCount: 1,
				modifiedCount: 1,
				upsertedCount: 0,
				upsertedId: null,
			};

			mockCollection.updateOne.mockResolvedValue(mockResult);

			const result = await usersSessionsRaw.updateConnectionStatusById('user789', 'conn012', undefined);

			expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);
			const [query, update] = mockCollection.updateOne.mock.calls[0];

			expect(query).toEqual({
				'_id': 'user789',
				'connections.id': 'conn012',
			});

			// Status should not be in the update when undefined
			expect(update.$set).not.toHaveProperty('connections.$.status');
			expect(update.$set).toHaveProperty('connections.$._updatedAt');
			expect(update.$set['connections.$._updatedAt']).toBeInstanceOf(Date);

			expect(result).toEqual(mockResult);
		});

		test('should update only _updatedAt when status is not provided (omitted parameter)', async () => {
			const mockResult: UpdateResult = {
				acknowledged: true,
				matchedCount: 1,
				modifiedCount: 1,
				upsertedCount: 0,
				upsertedId: null,
			};

			mockCollection.updateOne.mockResolvedValue(mockResult);

			// Call without the third parameter
			const result = await usersSessionsRaw.updateConnectionStatusById('user345', 'conn678');

			expect(mockCollection.updateOne).toHaveBeenCalledTimes(1);
			const [query, update] = mockCollection.updateOne.mock.calls[0];

			expect(query).toEqual({
				'_id': 'user345',
				'connections.id': 'conn678',
			});

			expect(update.$set).not.toHaveProperty('connections.$.status');
			expect(update.$set).toHaveProperty('connections.$._updatedAt');

			expect(result).toEqual(mockResult);
		});

		test('should handle empty string status', async () => {
			const mockResult: UpdateResult = {
				acknowledged: true,
				matchedCount: 1,
				modifiedCount: 1,
				upsertedCount: 0,
				upsertedId: null,
			};

			mockCollection.updateOne.mockResolvedValue(mockResult);

			await usersSessionsRaw.updateConnectionStatusById('user111', 'conn222', '');

			const [, update] = mockCollection.updateOne.mock.calls[0];

			// Empty string is falsy, so status should not be set
			expect(update.$set).not.toHaveProperty('connections.$.status');
			expect(update.$set).toHaveProperty('connections.$._updatedAt');
		});

		test('should handle various status values', async () => {
			const mockResult: UpdateResult = {
				acknowledged: true,
				matchedCount: 1,
				modifiedCount: 1,
				upsertedCount: 0,
				upsertedId: null,
			};

			mockCollection.updateOne.mockResolvedValue(mockResult);

			const statuses = ['online', 'away', 'busy', 'offline'];

			for (const status of statuses) {
				mockCollection.updateOne.mockClear();
				await usersSessionsRaw.updateConnectionStatusById('user', 'conn', status);

				const [, update] = mockCollection.updateOne.mock.calls[0];
				expect(update.$set).toHaveProperty('connections.$.status', status);
			}
		});

		test('should use correct positional operator for nested array update', async () => {
			const mockResult: UpdateResult = {
				acknowledged: true,
				matchedCount: 1,
				modifiedCount: 1,
				upsertedCount: 0,
				upsertedId: null,
			};

			mockCollection.updateOne.mockResolvedValue(mockResult);

			await usersSessionsRaw.updateConnectionStatusById('user999', 'conn888', 'away');

			const [query, update] = mockCollection.updateOne.mock.calls[0];

			// Verify the positional operator $ is used correctly
			expect(query).toHaveProperty('connections.id', 'conn888');
			expect(update.$set).toHaveProperty('connections.$.status');
			expect(update.$set).toHaveProperty('connections.$._updatedAt');
		});

		test('should create new Date object for each call', async () => {
			const mockResult: UpdateResult = {
				acknowledged: true,
				matchedCount: 1,
				modifiedCount: 1,
				upsertedCount: 0,
				upsertedId: null,
			};

			mockCollection.updateOne.mockResolvedValue(mockResult);

			// Make two calls with a slight delay
			await usersSessionsRaw.updateConnectionStatusById('user1', 'conn1', 'online');
			const firstCallDate = mockCollection.updateOne.mock.calls[0][1].$set['connections.$._updatedAt'];

			await new Promise((resolve) => setTimeout(resolve, 10));

			await usersSessionsRaw.updateConnectionStatusById('user2', 'conn2', 'away');
			const secondCallDate = mockCollection.updateOne.mock.calls[1][1].$set['connections.$._updatedAt'];

			// Dates should be different instances
			expect(firstCallDate).not.toBe(secondCallDate);
			expect(secondCallDate.getTime()).toBeGreaterThanOrEqual(firstCallDate.getTime());
		});

		test('should handle database errors gracefully', async () => {
			const error = new Error('Database connection failed');
			mockCollection.updateOne.mockRejectedValue(error);

			await expect(usersSessionsRaw.updateConnectionStatusById('user', 'conn', 'online')).rejects.toThrow(
				'Database connection failed',
			);
		});

		test('should return the result from updateOne', async () => {
			const mockResult: UpdateResult = {
				acknowledged: true,
				matchedCount: 1,
				modifiedCount: 0, // No modifications made
				upsertedCount: 0,
				upsertedId: null,
			};

			mockCollection.updateOne.mockResolvedValue(mockResult);

			const result = await usersSessionsRaw.updateConnectionStatusById('user', 'conn', 'online');

			expect(result).toEqual(mockResult);
			expect(result.modifiedCount).toBe(0);
		});

		test('should handle special characters in userId and connectionId', async () => {
			const mockResult: UpdateResult = {
				acknowledged: true,
				matchedCount: 1,
				modifiedCount: 1,
				upsertedCount: 0,
				upsertedId: null,
			};

			mockCollection.updateOne.mockResolvedValue(mockResult);

			const specialUserId = 'user$123.test@example';
			const specialConnId = 'conn-{uuid}[special]';

			await usersSessionsRaw.updateConnectionStatusById(specialUserId, specialConnId, 'online');

			const [query] = mockCollection.updateOne.mock.calls[0];

			expect(query).toEqual({
				'_id': specialUserId,
				'connections.id': specialConnId,
			});
		});
	});
});