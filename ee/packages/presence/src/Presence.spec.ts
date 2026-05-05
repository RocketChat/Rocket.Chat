import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { registerModel } from '@rocket.chat/models';

import { Presence } from './Presence';

const findUserMock = jest.fn();
const updatePresenceMock = jest.fn();
const updateStatusMock = jest.fn();
const findSessionMock = jest.fn();

registerModel('IUsersModel', {
	findOneForPresenceEngine: findUserMock,
	updatePresenceAndStatus: updatePresenceMock,
	updateStatusById: updateStatusMock,
	findExpiredStatuses: jest.fn(),
} as any);

registerModel('IUsersSessionsModel', {
	findOneById: findSessionMock,
	addConnectionById: jest.fn(),
	removeConnectionByConnectionId: jest.fn(),
	updateConnectionStatusById: jest.fn(),
} as any);

const user = (o: Partial<IUser> = {}): IUser =>
	({
		_id: 'u1',
		username: 'test',
		roles: ['user'],
		status: UserStatus.ONLINE,
		statusDefault: UserStatus.ONLINE,
		statusConnection: UserStatus.ONLINE,
		statusText: '',
		...o,
	}) as IUser;

const withOnlineSession = () =>
	findSessionMock.mockResolvedValue({ connections: [{ id: 's1', instanceId: 'i1', status: UserStatus.ONLINE }] });

describe('Presence.recalculateStatusFromConnections', () => {
	let presence: Presence;

	beforeEach(() => {
		jest.clearAllMocks();
		presence = new Presence();
		(presence as any).broadcastEnabled = true;
		(presence as any).api = { broadcast: jest.fn(), nodeList: jest.fn().mockResolvedValue([]) };
	});

	it('when engine changes status, should write combined status + connection to DB', async () => {
		findUserMock.mockResolvedValue(user());
		withOnlineSession();
		updatePresenceMock.mockResolvedValue(user());

		await presence.recalculateStatusFromConnections('u1', {
			values: { statusDefault: UserStatus.BUSY, statusSource: 'manual' },
		});

		expect(updatePresenceMock.mock.calls[0][1]).toMatchObject({ status: UserStatus.BUSY, statusConnection: UserStatus.ONLINE });
	});

	it('when engine only queues previousState (lower priority), should not touch status or connections', async () => {
		findUserMock.mockResolvedValue(user({ statusDefault: UserStatus.BUSY, statusSource: 'external' }));
		updatePresenceMock.mockResolvedValue(user());

		await presence.recalculateStatusFromConnections('u1', {
			values: { previousState: { statusDefault: UserStatus.BUSY, statusText: 'WFH', statusSource: 'manual' } },
		});

		expect(findSessionMock).not.toHaveBeenCalled();
		expect(updatePresenceMock.mock.calls[0][1].status).toBeUndefined();
		expect(updatePresenceMock.mock.calls[0][1].statusConnection).toBeUndefined();
	});

	it('when engine changes status but user has no sessions (REST-only), should keep engine status as-is', async () => {
		findUserMock.mockResolvedValue(user());
		findSessionMock.mockResolvedValue(null);
		updatePresenceMock.mockResolvedValue(user());

		await presence.recalculateStatusFromConnections('u1', {
			values: { statusDefault: UserStatus.BUSY, statusSource: 'manual' },
		});

		// Should NOT override with offline — REST-only user keeps the engine's status
		expect(updatePresenceMock.mock.calls[0][1].status).toBeUndefined();
		expect(updatePresenceMock.mock.calls[0][1].statusConnection).toBeUndefined();
	});

	it('when no engine result, should recalculate status from sessions only', async () => {
		findUserMock.mockResolvedValue(user({ statusDefault: UserStatus.BUSY }));
		withOnlineSession();
		updateStatusMock.mockResolvedValue({ modifiedCount: 1 });

		await presence.recalculateStatusFromConnections('u1');

		expect(updateStatusMock).toHaveBeenCalledWith('u1', { status: UserStatus.BUSY, statusConnection: UserStatus.ONLINE });
	});

	it('when user has no sessions, should resolve to offline', async () => {
		findUserMock.mockResolvedValue(user());
		findSessionMock.mockResolvedValue(null);
		updateStatusMock.mockResolvedValue({ modifiedCount: 1 });

		await presence.recalculateStatusFromConnections('u1');

		expect(updateStatusMock).toHaveBeenCalledWith('u1', { status: UserStatus.OFFLINE, statusConnection: UserStatus.OFFLINE });
	});

	it('when user is not found, should not write anything', async () => {
		findUserMock.mockResolvedValue(null);

		await presence.recalculateStatusFromConnections('u1', { values: { statusDefault: UserStatus.BUSY } });

		expect(updatePresenceMock).not.toHaveBeenCalled();
		expect(updateStatusMock).not.toHaveBeenCalled();
	});
});
