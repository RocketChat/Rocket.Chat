import type { IUser } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { registerModel } from '@rocket.chat/models';

import { Presence } from './Presence';

const findUserMock = jest.fn();
const updatePresenceMock = jest.fn();
const findSessionMock = jest.fn();

registerModel('IUsersModel', {
	findOneById: findUserMock,
	updatePresenceAndStatus: updatePresenceMock,
	findExpiredStatuses: jest.fn(),
	findNextStatusExpiration: jest.fn().mockResolvedValue(null),
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

const withNoSessions = () => findSessionMock.mockResolvedValue(null);

describe('Presence class', () => {
	let presence: Presence;

	beforeEach(() => {
		jest.clearAllMocks();
		presence = new Presence();
		(presence as any).broadcastEnabled = true;
		(presence as any).api = { broadcast: jest.fn(), nodeList: jest.fn().mockResolvedValue([]) };
		updatePresenceMock.mockResolvedValue(user());
	});

	describe('setActiveState', () => {
		it('should apply claim and write combined result when user is online', async () => {
			findUserMock.mockResolvedValue(user());
			withOnlineSession();

			await presence.setActiveState('u1', {
				statusDefault: UserStatus.BUSY,
				statusSource: 'manual',
				statusText: 'Focus',
			});

			expect(updatePresenceMock).toHaveBeenCalledWith(
				'u1',
				expect.objectContaining({ statusDefault: UserStatus.BUSY, statusSource: 'manual', status: UserStatus.BUSY }),
				expect.any(Array),
				undefined,
			);
		});

		it('should not write when claim is rejected (offline + external)', async () => {
			findUserMock.mockResolvedValue(user({ statusDefault: UserStatus.OFFLINE }));
			withNoSessions();

			await presence.setActiveState('u1', {
				statusDefault: UserStatus.BUSY,
				statusSource: 'external',
			});

			expect(updatePresenceMock).not.toHaveBeenCalled();
		});

		it('should store claim but show offline status when user has no sessions', async () => {
			findUserMock.mockResolvedValue(user({ statusDefault: UserStatus.ONLINE }));
			withNoSessions();

			await presence.setActiveState('u1', {
				statusDefault: UserStatus.BUSY,
				statusSource: 'manual',
				statusText: 'Working',
			});

			expect(updatePresenceMock).toHaveBeenCalledWith(
				'u1',
				expect.objectContaining({ status: UserStatus.OFFLINE, statusConnection: UserStatus.OFFLINE, statusDefault: UserStatus.BUSY }),
				expect.any(Array),
				undefined,
			);
		});

		it('should pass expiresAt when provided', async () => {
			const expiresAt = new Date(Date.now() + 3600_000);
			findUserMock.mockResolvedValue(user());
			withOnlineSession();

			await presence.setActiveState('u1', {
				statusDefault: UserStatus.BUSY,
				statusSource: 'manual',
				statusText: 'Focus',
				statusExpiresAt: expiresAt,
			});

			expect(updatePresenceMock).toHaveBeenCalledWith(
				'u1',
				expect.objectContaining({ statusExpiresAt: expiresAt }),
				expect.arrayContaining(['previousState']),
				undefined,
			);
		});

		it('should reject a past statusExpiresAt', async () => {
			await expect(
				presence.setActiveState('u1', {
					statusDefault: UserStatus.BUSY,
					statusSource: 'manual',
					statusText: 'Focus',
					statusExpiresAt: new Date(Date.now() - 3600_000),
				}),
			).rejects.toThrow('statusExpiresAt must be a future date');

			expect(updatePresenceMock).not.toHaveBeenCalled();
		});

		it('should reject an invalid statusExpiresAt', async () => {
			await expect(
				presence.setActiveState('u1', {
					statusDefault: UserStatus.BUSY,
					statusSource: 'manual',
					statusText: 'Focus',
					statusExpiresAt: new Date('not a date'),
				}),
			).rejects.toThrow('statusExpiresAt must be a future date');

			expect(updatePresenceMock).not.toHaveBeenCalled();
		});
	});

	describe('endActiveState', () => {
		it('should restore previous state and write', async () => {
			findUserMock.mockResolvedValue(
				user({
					statusSource: 'manual',
					statusDefault: UserStatus.BUSY,
					previousState: { statusDefault: UserStatus.BUSY, statusText: 'Meeting', statusSource: 'external' },
				}),
			);
			withOnlineSession();

			await presence.endActiveState('u1');

			expect(updatePresenceMock).toHaveBeenCalledWith(
				'u1',
				expect.objectContaining({ statusSource: 'external', statusText: 'Meeting' }),
				expect.arrayContaining(['previousState']),
				undefined,
			);
		});
	});

	describe('clearActiveState', () => {
		it('should reset to online and write', async () => {
			findUserMock.mockResolvedValue(user({ statusDefault: UserStatus.BUSY, statusSource: 'manual' }));
			withOnlineSession();

			await presence.clearActiveState('u1');

			expect(updatePresenceMock).toHaveBeenCalledWith(
				'u1',
				expect.objectContaining({ statusDefault: UserStatus.ONLINE, statusText: '', status: UserStatus.ONLINE }),
				expect.arrayContaining(['statusSource', 'previousState']),
				undefined,
			);
		});
	});

	describe('setStatus', () => {
		it('should apply a manual claim when status changes', async () => {
			findUserMock.mockResolvedValue(user());
			withOnlineSession();

			await presence.setStatus('u1', UserStatus.BUSY, 'Working');

			expect(updatePresenceMock).toHaveBeenCalledWith(
				'u1',
				expect.objectContaining({ statusDefault: UserStatus.BUSY, statusSource: 'manual' }),
				expect.any(Array),
				undefined,
			);
		});

		it('should trigger clearActive when status is ONLINE with no text', async () => {
			findUserMock.mockResolvedValue(user({ statusDefault: UserStatus.BUSY, statusSource: 'manual' }));
			withOnlineSession();

			await presence.setStatus('u1', UserStatus.ONLINE);

			expect(updatePresenceMock).toHaveBeenCalledWith(
				'u1',
				expect.objectContaining({ statusDefault: UserStatus.ONLINE }),
				expect.arrayContaining(['statusSource', 'previousState']),
				undefined,
			);
		});

		it('should trigger clearActive when status is ONLINE with empty string text', async () => {
			findUserMock.mockResolvedValue(user({ statusDefault: UserStatus.BUSY, statusSource: 'manual' }));
			withOnlineSession();

			await presence.setStatus('u1', UserStatus.ONLINE, '');

			expect(updatePresenceMock).toHaveBeenCalledWith(
				'u1',
				expect.objectContaining({ statusDefault: UserStatus.ONLINE }),
				expect.arrayContaining(['statusSource', 'previousState']),
				undefined,
			);
		});

		it('should trigger setActive when status is ONLINE with text', async () => {
			findUserMock.mockResolvedValue(user());
			withOnlineSession();

			await presence.setStatus('u1', UserStatus.ONLINE, 'brb');

			expect(updatePresenceMock).toHaveBeenCalledWith(
				'u1',
				expect.objectContaining({ statusDefault: UserStatus.ONLINE, statusSource: 'manual', statusText: 'brb' }),
				expect.any(Array),
				undefined,
			);
		});

		it('should write empty string statusText when explicitly provided', async () => {
			findUserMock.mockResolvedValue(user({ statusText: 'Old text' }));
			withOnlineSession();

			await presence.setStatus('u1', UserStatus.BUSY, '');

			expect(updatePresenceMock).toHaveBeenCalledWith(
				'u1',
				expect.objectContaining({ statusDefault: UserStatus.BUSY, statusText: '' }),
				expect.any(Array),
				undefined,
			);
		});

		it('should not include statusText when undefined', async () => {
			findUserMock.mockResolvedValue(user({ statusText: 'Old text' }));
			withOnlineSession();

			await presence.setStatus('u1', UserStatus.BUSY);

			const updateArg = updatePresenceMock.mock.calls[0][1];
			expect(updateArg).not.toHaveProperty('statusText');
		});

		it('should not write when user is not found', async () => {
			findUserMock.mockResolvedValue(null);

			await presence.setStatus('u1', UserStatus.BUSY);

			expect(updatePresenceMock).not.toHaveBeenCalled();
		});
	});
});
