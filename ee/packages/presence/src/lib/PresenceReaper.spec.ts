import { UserStatus, type IUserSession, type IUserSessionConnection } from '@rocket.chat/core-typings';
import { registerModel } from '@rocket.chat/models';
import type { FindCursor, WithId } from 'mongodb';

import { PresenceReaper } from './PresenceReaper';

let sessions = 0;
const createSession = (overrides: Partial<IUserSession> = {}): IUserSession => ({
	_id: `user-${sessions++}`,
	connections: [],
	...overrides,
});

let connections = 0;
const createConnection = (overrides: Partial<IUserSessionConnection> = {}): IUserSessionConnection => ({
	id: `conn-${connections++}`,
	instanceId: `instanceId`,
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

	it('should not call onUpdate when there no connections', async () => {
		findMock.mockReturnValue(createCursor([]));

		await reaper.run();

		expect(onUpdateMock).not.toHaveBeenCalled();
	});

	it('should process users with stale connections correctly', async () => {
		const { stale } = createDates();

		findMock.mockReturnValue(
			createCursor([
				createSession({
					_id: 'user-789',
					connections: [createConnection({ _updatedAt: stale })],
				}),
			]),
		);

		await reaper.run();

		expect(onUpdateMock).toHaveBeenCalledTimes(1);
		expect(onUpdateMock).toHaveBeenCalledWith(['user-789']);
	});

	it('should process multiple users and batch updates correctly', async () => {
		const { stale } = createDates();

		findMock.mockReturnValue(
			createCursor([
				createSession({
					_id: 'user-1',
					connections: [createConnection({ _updatedAt: stale })],
				}),
				createSession({
					_id: 'user-2',
					connections: [createConnection({ _updatedAt: stale })],
				}),
				createSession({
					_id: 'user-3',
					connections: [createConnection({ _updatedAt: stale })],
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
				createSession({
					_id: 'no-connections',
					connections: [],
				}),
				createSession({
					_id: 'all-active',
					connections: [createConnection({ _updatedAt: active })],
				}),
				createSession({
					_id: 'all-stale',
					connections: [createConnection({ _updatedAt: stale })],
				}),
				createSession({
					_id: 'mixed',
					connections: [createConnection({ _updatedAt: stale }), createConnection({ _updatedAt: active })],
				}),
			]),
		);

		// Execute Run
		await reaper.run();

		// Verify 'users' Update called for both users
		expect(onUpdateMock).toHaveBeenCalledTimes(1);
		expect(onUpdateMock).toHaveBeenNthCalledWith(1, ['all-stale', 'mixed']);
	});
});
