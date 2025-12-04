import type { IUserSession } from '@rocket.chat/core-typings';
import type { IUsersSessionsModel } from '@rocket.chat/model-typings';
import type { Collection } from 'mongodb';

import { PresenceReaper } from './PresenceReaper';

// Define a simplified interface for our mock docs
type MockSession = {
	_id: string;
	connections: { id: string; _updatedAt: Date }[];
};

describe('PresenceReaper', () => {
	let reaper: PresenceReaper;
	let mockSessionCollection: Omit<jest.Mocked<IUsersSessionsModel>, 'col'> & {
		col: jest.Mocked<Collection<IUserSession>>;
	};
	let mockOnUpdate: jest.Mock;

	beforeEach(() => {
		// 1. Mock the Collections
		mockSessionCollection = {
			find: jest.fn(),
			col: {
				bulkWrite: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
			},
		} as any;

		// 2. Mock the onUpdate callback
		mockOnUpdate = jest.fn();

		// 3. Instantiate Reaper
		reaper = new PresenceReaper(mockSessionCollection, mockOnUpdate);
	});

	describe('processDocument (Business Logic)', () => {
		it('should identify stale connections by "id" and preserve valid ones', () => {
			const now = new Date();
			const staleTime = new Date(now.getTime() - 10 * 60 * 1000); // 10 mins ago
			const activeTime = new Date(now.getTime() - 1 * 60 * 1000); // 1 min ago
			const cutoff = new Date(now.getTime() - 5 * 60 * 1000); // 5 mins ago

			const doc: MockSession = {
				_id: 'user-123',
				connections: [
					{ id: 'conn-stale', _updatedAt: staleTime }, // Should be removed
					{ id: 'conn-active', _updatedAt: activeTime }, // Should stay
				],
			};

			const changeMap = new Map();

			// @ts-expect-error - testing private method
			reaper.processDocument(doc, cutoff, changeMap);

			const result = changeMap.get('user-123');

			// Assertions
			expect(result).toBeDefined();
			expect(result?.removeIds).toContain('conn-stale'); // Found the stale ID
			expect(result?.removeIds).not.toContain('conn-active'); // Ignored the active ID
			expect(result?.shouldMarkOffline).toBe(false); // User still has 1 active connection
		});

		it('should mark user offline only if ALL connections are stale', () => {
			const now = new Date();
			const staleTime = new Date(now.getTime() - 10000);
			const cutoff = new Date(now); // Cutoff is now, so everything before is stale

			const doc: MockSession = {
				_id: 'user-456',
				connections: [
					{ id: 'conn-1', _updatedAt: staleTime },
					{ id: 'conn-2', _updatedAt: staleTime },
				],
			};

			const changeMap = new Map();
			// @ts-expect-error - testing private method
			reaper.processDocument(doc, cutoff, changeMap);

			const result = changeMap.get('user-456');

			expect(result).toBeDefined();
			expect(result?.removeIds).toHaveLength(2);
			expect(result?.shouldMarkOffline).toBe(true); // No valid connections left
		});
	});

	describe('run (Integration Flow)', () => {
		it('should generate correct bulkWrite operations', async () => {
			const now = new Date();
			const staleTime = new Date(now.getTime() - 6 * 60 * 1000); // 6 mins ago (Stale)

			// Mock Data from DB Cursor
			const mockCursor = {
				async *[Symbol.asyncIterator]() {
					yield {
						_id: 'user-789',
						connections: [{ id: 'zombie-conn', _updatedAt: staleTime }],
					};
				},
			} as any;
			mockSessionCollection.find.mockReturnValue(mockCursor);

			// Execute Run
			await reaper.run();

			// Verify 'usersSessions' Update
			expect(mockSessionCollection.col.bulkWrite).toHaveBeenCalledTimes(1);
			expect(mockSessionCollection.col.bulkWrite).toHaveBeenCalledWith(
				expect.arrayContaining([
					expect.objectContaining({
						updateOne: expect.objectContaining({
							filter: { _id: 'user-789' },
							update: {
								$pull: {
									connections: {
										id: { $in: ['zombie-conn'] },
										_updatedAt: { $lte: expect.any(Date) },
									},
								},
							},
						}),
					}),
				]),
			);

			// Verify 'users' Update (Status Offline)
			expect(mockOnUpdate).toHaveBeenCalledTimes(1);
			expect(mockOnUpdate).toHaveBeenCalledWith(['user-789']);
		});
	});
});
