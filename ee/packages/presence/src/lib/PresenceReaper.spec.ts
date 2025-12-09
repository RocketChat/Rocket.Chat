import { UserStatus, type IUserSession, type IUserSessionConnection } from '@rocket.chat/core-typings';
import { registerModel } from '@rocket.chat/models';
import type { FindCursor, WithId } from 'mongodb';

import { PresenceReaper, type ReaperPlan } from './PresenceReaper';

const createSession = (overrides: Partial<IUserSession> = {}): IUserSession => ({
	_id: 'user-id',
	connections: [],
	...overrides,
});

const createConnection = (overrides: Partial<IUserSessionConnection> = {}): IUserSessionConnection => ({
	id: 'connection-id',
	instanceId: 'instance-id',
	status: UserStatus.ONLINE,
	_createdAt: new Date(),
	_updatedAt: new Date(),
	...overrides,
});

const createDates = () => {
	const now = new Date();
	const stale = new Date(now.getTime() - 10 * 60 * 1000); // 10 mins ago
	const active = new Date(now.getTime() - 1 * 60 * 1000); // 1 min ago
	const cutoff = new Date(now.getTime() - 5 * 60 * 1000); // 5 mins ago

	return { now, stale, active, cutoff };
};

const createCursor = (documents: WithId<IUserSession>[]): FindCursor<WithId<IUserSession>> => {
	let index = 0;
	return {
		async *[Symbol.asyncIterator]() {
			while (index < documents.length) {
				yield documents[index++];
			}
		},
	} as FindCursor<WithId<IUserSession>>;
};

describe('PresenceReaper', () => {
	let reaper: PresenceReaper;
	const bulkWriteMock = jest.fn();
	const findMock = jest.fn();
	const onUpdateMock = jest.fn();
	registerModel('IUsersSessionsModel', {
		find: findMock,
		col: {
			bulkWrite: bulkWriteMock,
		},
	} as any);

	beforeEach(() => {
		bulkWriteMock.mockClear();
		findMock.mockClear();
		onUpdateMock.mockClear();

		reaper = new PresenceReaper({
			onUpdate: onUpdateMock,
			staleThresholdMs: 5 * 60 * 1000, // 5 minutes
			batchSize: 2, // small batch size for testing
		});
	});

	describe('processDocument (Business Logic)', () => {
		it('should identify stale connections by "id" and preserve valid ones', () => {
			const { stale, active, cutoff } = createDates();
			const doc = createSession({
				_id: 'user-123',
				connections: [
					createConnection({ id: 'conn-stale', _updatedAt: stale }), // Should be removed
					createConnection({ id: 'conn-active', _updatedAt: active }), // Should stay
				],
			});

			const changeMap = new Map<string, ReaperPlan>();
			reaper.processDocument(doc, cutoff, changeMap);

			const result = changeMap.get('user-123');

			// Assertions
			expect(result).toBeDefined();
			expect(result?.removeIds).toContain('conn-stale'); // Found the stale ID
			expect(result?.removeIds).not.toContain('conn-active'); // Ignored the active ID
			expect(result?.shouldMarkOffline).toBe(false); // User still has 1 active connection
		});

		it('should not mark user offline if there are still valid connections', () => {
			const { stale, active, cutoff } = createDates();
			const doc = createSession({
				_id: 'user-456',
				connections: [
					createConnection({ id: 'conn-stale', _updatedAt: stale, status: UserStatus.ONLINE }),
					createConnection({ id: 'conn-active', _updatedAt: active, status: UserStatus.AWAY }),
				],
			});

			const changeMap = new Map<string, ReaperPlan>();
			reaper.processDocument(doc, cutoff, changeMap);

			const result = changeMap.get('user-456');

			expect(result).toBeDefined();
			expect(result?.removeIds).toHaveLength(1);
			expect(result?.shouldMarkOffline).toBe(false); // Still has valid connection
		});

		it('should mark user offline only if ALL connections are stale', () => {
			const { stale, cutoff } = createDates();

			const doc = createSession({
				_id: 'user-456',
				connections: [
					createConnection({ id: 'conn-1', _updatedAt: stale, status: UserStatus.ONLINE }),
					createConnection({ id: 'conn-2', _updatedAt: stale, status: UserStatus.AWAY }),
				],
			});

			const changeMap = new Map<string, ReaperPlan>();
			reaper.processDocument(doc, cutoff, changeMap);

			const result = changeMap.get('user-456');

			expect(result).toBeDefined();
			expect(result?.removeIds).toHaveLength(2);
			expect(result?.shouldMarkOffline).toBe(true); // No valid connections left
		});
	});

	describe('run (Integration Flow)', () => {
		it('should handle empty collections without errors', async () => {
			// Mock empty cursor
			findMock.mockReturnValue(createCursor([]));

			// Execute Run
			await reaper.run();

			// Verify no updates were made
			expect(onUpdateMock).not.toHaveBeenCalled();
		});

		it('should generate correct bulkWrite operations', async () => {
			const { stale } = createDates();

			// Mock Data from DB Cursor

			findMock.mockReturnValue(
				createCursor([
					createSession({
						_id: 'user-789',
						connections: [createConnection({ id: 'zombie-conn', _updatedAt: stale })],
					}),
				]),
			);

			// Execute Run
			await reaper.run();

			// Verify 'users' Update (Status Offline)
			expect(onUpdateMock).toHaveBeenCalledTimes(1);
			expect(onUpdateMock).toHaveBeenCalledWith(['user-789']);
		});
	});

	describe('end-to-end Presence Reaping', () => {
		it('should process multiple users and batch updates correctly', async () => {
			const { stale } = createDates();

			findMock.mockReturnValue(
				createCursor([
					createSession({
						_id: 'user-1',
						connections: [createConnection({ id: 'conn-1', _updatedAt: stale })],
					}),
					createSession({
						_id: 'user-2',
						connections: [createConnection({ id: 'conn-2', _updatedAt: stale })],
					}),
					createSession({
						_id: 'user-3',
						connections: [createConnection({ id: 'conn-3', _updatedAt: stale })],
					}),
				]),
			);

			// Execute Run
			await reaper.run();

			// Verify 'users' Update called twice due to batch size of 2
			expect(onUpdateMock).toHaveBeenCalledTimes(2);
			expect(onUpdateMock).toHaveBeenNthCalledWith(1, ['user-1', 'user-2']);
			expect(onUpdateMock).toHaveBeenNthCalledWith(2, ['user-3']);
		});

		it('should process users with mixed connection states correctly', async () => {
			const { stale, active } = createDates();

			findMock.mockReturnValue(
				createCursor([
					// User with all stale connections
					createSession({
						_id: 'user-all-stale',
						connections: [createConnection({ id: 'conn-stale-1', _updatedAt: stale })],
					}),
					// User with mixed connections
					createSession({
						_id: 'user-mixed',
						connections: [
							createConnection({ id: 'conn-stale-2', _updatedAt: stale }),
							createConnection({ id: 'conn-active-1', _updatedAt: active }),
						],
					}),
				]),
			);

			// Execute Run
			await reaper.run();

			// Verify 'users' Update called for both users
			expect(onUpdateMock).toHaveBeenCalledTimes(1);
			expect(onUpdateMock).toHaveBeenNthCalledWith(1, ['user-all-stale', 'user-mixed']);
		});
	});
});
