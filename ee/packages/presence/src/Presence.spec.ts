import type { ISettingsService, IStatusVisibilityService } from '@rocket.chat/core-services';
import { LocalBroker, MeteorError, ServiceClass, api } from '@rocket.chat/core-services';
import type { IUser, SettingValue } from '@rocket.chat/core-typings';
import { UserStatus } from '@rocket.chat/core-typings';
import { cronJobs } from '@rocket.chat/cron';
import { registerModel } from '@rocket.chat/models';

import { Presence } from './Presence';

const usersModel = {
	findOneById: jest.fn(),
	updatePresenceAndStatus: jest.fn(),
	findExpiredStatuses: jest.fn(),
	findNextStatusExpiration: jest.fn().mockResolvedValue(null),
};

const sessionsModel = {
	findOneById: jest.fn(),
	addConnectionById: jest.fn(),
	removeConnectionByConnectionId: jest.fn(),
	updateOne: jest.fn(),
	updateConnectionStatusById: jest.fn(),
	findByInstanceId: jest.fn(),
	removeConnectionsFromInstanceId: jest.fn(),
	findByOtherInstanceIds: jest.fn(),
	removeConnectionsFromOtherInstanceIds: jest.fn(),
};

registerModel('IUsersModel', usersModel as any);
registerModel('IUsersSessionsModel', sessionsModel as any);

class SettingsService extends ServiceClass implements Pick<ISettingsService, 'set'> {
	protected name = 'settings';

	values = new Map<string, SettingValue>();

	async set<T extends SettingValue>(settingId: string, value: T): Promise<void> {
		this.values.set(settingId, value);
	}
}

class StatusVisibilityService extends ServiceClass implements Pick<IStatusVisibilityService, 'isPresenceDisabledFor'> {
	protected name = 'status-visibility';

	disabledFor = new Set<string>();

	async isPresenceDisabledFor(targetId: string): Promise<boolean> {
		return this.disabledFor.has(targetId);
	}
}

class PresenceStatusListener extends ServiceClass {
	protected name = 'presence-status-listener';

	received: Partial<IUser>[] = [];

	constructor() {
		super();
		this.onEvent('presence.status', ({ user }) => {
			this.received.push(user);
		});
	}
}

const settings = new SettingsService();
const statusVisibility = new StatusVisibilityService();
const listener = new PresenceStatusListener();
const fakes = [settings, statusVisibility, listener];

const alice = (fields: Partial<IUser> = {}): IUser =>
	({
		_id: 'alice',
		username: 'alice',
		roles: ['user'],
		status: UserStatus.ONLINE,
		statusDefault: UserStatus.ONLINE,
		statusConnection: UserStatus.ONLINE,
		statusText: '',
		...fields,
	}) as IUser;

const aliceIsConnected = (status = UserStatus.ONLINE) =>
	sessionsModel.findOneById.mockResolvedValue({ connections: [{ id: 'alice-desktop', instanceId: 'instance-a', status }] });
const aliceIsDisconnected = () => sessionsModel.findOneById.mockResolvedValue(null);

const broadcastStatuses = () => listener.received.map(({ status }) => status);
const settle = () => new Promise((resolve) => setImmediate(resolve));
const emit: typeof api.broadcast = async (event, ...args) => {
	await api.broadcast(event, ...args);
	await settle();
};
const instanceConnections = (instanceId: string, conns: number) =>
	emit('watch.instanceStatus', { clientAction: 'updated', id: instanceId, diff: { 'extraInformation.conns': conns } });

describe('Presence', () => {
	let presence: Presence;

	beforeAll(() => {
		api.setBroker(new LocalBroker());
		fakes.forEach((fake) => api.registerService(fake));
	});

	afterAll(async () => {
		await Promise.all(fakes.map((fake) => api.destroyService(fake)));
	});

	beforeEach(() => {
		jest.clearAllMocks();
		settings.values.clear();
		listener.received = [];
		statusVisibility.disabledFor.clear();
		usersModel.findOneById.mockResolvedValue(alice());
		usersModel.updatePresenceAndStatus.mockImplementation(async (_id: string, values: Partial<IUser>, clear: string[] = []) => {
			const updated: Record<string, unknown> = { ...(await usersModel.findOneById(_id)), ...values };
			clear.forEach((field) => delete updated[field]);
			return updated;
		});

		presence = new Presence();
		api.registerService(presence);
	});

	afterEach(async () => {
		await api.destroyService(presence);
	});

	describe('status chosen by the user', () => {
		it('should apply a manual status with its message and expiration', async () => {
			const expiresAt = new Date(Date.now() + 3600_000);
			aliceIsConnected();

			await presence.setStatus('alice', UserStatus.BUSY, 'Focus', expiresAt);

			expect(listener.received).toEqual([
				expect.objectContaining({
					status: UserStatus.BUSY,
					statusSource: 'manual',
					statusText: 'Focus',
					statusExpiresAt: expiresAt,
				}),
			]);
		});

		it('should go back to connection-driven presence when online is chosen without a message, and keep a message', async () => {
			usersModel.findOneById.mockResolvedValue(
				alice({ status: UserStatus.BUSY, statusDefault: UserStatus.BUSY, statusSource: 'manual', statusText: 'Focus' }),
			);
			aliceIsConnected();

			await presence.setStatus('alice', UserStatus.ONLINE);
			await presence.setStatus('alice', UserStatus.ONLINE, '');
			await presence.setStatus('alice', UserStatus.ONLINE, 'brb');

			expect(listener.received.map(({ statusSource, statusText }) => ({ statusSource, statusText }))).toEqual([
				{ statusSource: undefined, statusText: '' },
				{ statusSource: undefined, statusText: '' },
				{ statusSource: 'manual', statusText: 'brb' },
			]);
		});

		it('should keep the message when none is given, and clear it when an empty one is given', async () => {
			usersModel.findOneById.mockResolvedValue(alice({ statusText: 'Old text' }));
			aliceIsConnected();

			await presence.setStatus('alice', UserStatus.BUSY);
			await presence.setStatus('alice', UserStatus.BUSY, '');

			expect(listener.received.map(({ statusText }) => statusText)).toEqual(['Old text', '']);
		});

		it('should change nothing for an unknown user', async () => {
			usersModel.findOneById.mockResolvedValue(null);

			await expect(presence.setStatus('ghost', UserStatus.BUSY)).resolves.toBe(false);
			expect(listener.received).toEqual([]);
		});

		it('should refuse the change when an admin disabled presence and presence is licensed', async () => {
			await emit('license.module', { module: 'unlimited-presence', valid: true });
			statusVisibility.disabledFor.add('alice');
			aliceIsConnected();

			await expect(presence.setStatus('alice', UserStatus.BUSY, 'Focus')).rejects.toThrow(
				new MeteorError('error-presence-disabled', 'Presence is disabled for this user'),
			);
			expect(listener.received).toEqual([]);
		});

		it('should ignore the admin switch without a presence license', async () => {
			statusVisibility.disabledFor.add('alice');
			aliceIsConnected();

			await expect(presence.setStatus('alice', UserStatus.BUSY, 'Focus')).resolves.toBe(true);
			expect(broadcastStatuses()).toEqual([UserStatus.BUSY]);
		});
	});

	describe('claims from integrations', () => {
		it('should apply a claim with its expiration and a trimmed message', async () => {
			const expiresAt = new Date(Date.now() + 3600_000);
			aliceIsConnected();

			await presence.setActiveState('alice', {
				statusDefault: UserStatus.BUSY,
				statusSource: 'external',
				statusText: '  In a meeting  ',
				statusExpiresAt: expiresAt,
			});

			expect(listener.received).toEqual([
				expect.objectContaining({
					status: UserStatus.BUSY,
					statusSource: 'external',
					statusText: 'In a meeting',
					statusExpiresAt: expiresAt,
				}),
			]);
		});

		it('should reject an expiration that is not in the future', async () => {
			const claim = { statusDefault: UserStatus.BUSY, statusSource: 'external' as const, statusText: 'In a meeting' };

			await expect(presence.setActiveState('alice', { ...claim, statusExpiresAt: new Date(Date.now() - 3600_000) })).rejects.toThrow(
				'statusExpiresAt must be a future date',
			);
			await expect(presence.setActiveState('alice', { ...claim, statusExpiresAt: new Date('not a date') })).rejects.toThrow(
				'statusExpiresAt must be a future date',
			);
			expect(listener.received).toEqual([]);
		});

		it('should restore the displaced status when a claim ends, unless that claim is no longer active', async () => {
			usersModel.findOneById.mockResolvedValue(
				alice({
					status: UserStatus.BUSY,
					statusSource: 'internal',
					statusDefault: UserStatus.BUSY,
					statusText: 'On a call',
					statusId: 'call-1',
					previousState: { statusDefault: UserStatus.ONLINE, statusText: '', statusSource: 'manual' },
				}),
			);
			aliceIsConnected();

			await presence.endActiveState('alice', 'call-2');
			expect(listener.received).toEqual([]);

			await presence.endActiveState('alice', 'call-1');
			expect(listener.received).toEqual([expect.objectContaining({ status: UserStatus.ONLINE, statusSource: 'manual', statusText: '' })]);
		});

		it('should drop every claim and go back to online when cleared', async () => {
			usersModel.findOneById.mockResolvedValue(
				alice({
					status: UserStatus.BUSY,
					statusSource: 'manual',
					statusDefault: UserStatus.BUSY,
					statusText: 'Focus',
					previousState: { statusDefault: UserStatus.BUSY, statusText: 'In a meeting', statusSource: 'external' },
				}),
			);
			aliceIsConnected();

			await presence.clearActiveState('alice');

			expect(listener.received).toEqual([
				expect.objectContaining({ status: UserStatus.ONLINE, statusDefault: UserStatus.ONLINE, statusText: '' }),
			]);
		});
	});

	describe('connections', () => {
		it('should bring a user online on a new connection and offline when the last one closes', async () => {
			usersModel.findOneById.mockResolvedValue(alice({ status: UserStatus.OFFLINE, statusConnection: UserStatus.OFFLINE }));
			aliceIsConnected();

			await expect(presence.newConnection('alice', 'alice-desktop', 'instance-a')).resolves.toEqual({
				uid: 'alice',
				connectionId: 'alice-desktop',
			});

			usersModel.findOneById.mockResolvedValue(alice());
			aliceIsDisconnected();

			await expect(presence.removeConnection('alice', 'alice-desktop')).resolves.toEqual({ uid: 'alice', session: 'alice-desktop' });
			expect(broadcastStatuses()).toEqual([UserStatus.ONLINE, UserStatus.OFFLINE]);
		});

		it('should ignore connections without a user or a session', async () => {
			await expect(presence.newConnection(undefined, 'anonymous-session', 'instance-a')).resolves.toBeUndefined();
			await expect(presence.newConnection('alice', undefined, 'instance-a')).resolves.toBeUndefined();
			await expect(presence.removeConnection(undefined, 'anonymous-session')).resolves.toBeUndefined();

			expect(sessionsModel.addConnectionById).not.toHaveBeenCalled();
			expect(listener.received).toEqual([]);
		});

		it('should refresh only a connection it knows', async () => {
			sessionsModel.updateOne.mockResolvedValueOnce({ modifiedCount: 0 }).mockResolvedValueOnce({ modifiedCount: 1 });

			await expect(presence.updateConnection('alice', 'unknown-session')).resolves.toBeUndefined();
			await expect(presence.updateConnection('alice', 'alice-desktop')).resolves.toEqual({ uid: 'alice', connectionId: 'alice-desktop' });
		});

		it('should mark the user away when their connection reports away', async () => {
			aliceIsConnected(UserStatus.AWAY);
			sessionsModel.updateConnectionStatusById.mockResolvedValueOnce({ modifiedCount: 1 }).mockResolvedValueOnce({ modifiedCount: 0 });

			await expect(presence.setConnectionStatus('alice', UserStatus.AWAY, 'alice-desktop')).resolves.toBe(true);
			await expect(presence.setConnectionStatus('alice', UserStatus.AWAY, 'unknown-session')).resolves.toBe(false);
			expect(broadcastStatuses()[0]).toBe(UserStatus.AWAY);
		});
	});

	describe('lost instances', () => {
		it('should take offline the users of an instance that went away, unless its connections were already removed', async () => {
			sessionsModel.findByInstanceId.mockReturnValue({ toArray: async () => [{ _id: 'alice' }] });
			sessionsModel.removeConnectionsFromInstanceId.mockImplementation(async (instanceId: string) => ({
				modifiedCount: instanceId === 'instance-already-cleaned' ? 0 : 1,
			}));
			aliceIsDisconnected();

			await emit('watch.instanceStatus', { clientAction: 'removed', id: 'instance-already-cleaned' });
			expect(listener.received).toEqual([]);

			await emit('watch.instanceStatus', { clientAction: 'removed', id: 'instance-a' });
			expect(broadcastStatuses()).toEqual([UserStatus.OFFLINE]);

			await presence.onNodeDisconnected({ node: { id: 'instance-b', available: false } });
			await settle();
			expect(broadcastStatuses()).toEqual([UserStatus.OFFLINE, UserStatus.OFFLINE]);
		});

		it('should drop connections held by instances that are no longer alive', async () => {
			sessionsModel.findByOtherInstanceIds.mockImplementation((liveInstanceIds: string[]) => ({
				toArray: async () => (liveInstanceIds.join() === 'instance-a' ? [{ _id: 'bob' }] : []),
			}));
			sessionsModel.removeConnectionsFromOtherInstanceIds.mockResolvedValue({ modifiedCount: 1 });

			const nodeList = jest.spyOn(api, 'nodeList').mockResolvedValue([
				{ id: 'instance-a', available: true },
				{ id: 'instance-b', available: false },
			]);
			await expect(presence.removeLostConnections()).resolves.toEqual(['bob']);

			sessionsModel.removeConnectionsFromOtherInstanceIds.mockResolvedValueOnce({ modifiedCount: 0 });
			await expect(presence.removeLostConnections()).resolves.toEqual([]);

			nodeList.mockResolvedValue([]);
			sessionsModel.removeConnectionsFromOtherInstanceIds.mockClear();
			await expect(presence.removeLostConnections()).resolves.toEqual([]);
			expect(sessionsModel.removeConnectionsFromOtherInstanceIds).not.toHaveBeenCalled();
		});
	});

	describe('broadcast limit', () => {
		it('should stop broadcasting above 200 connections without a license', async () => {
			aliceIsConnected();
			await instanceConnections('instance-a', 150);
			await instanceConnections('instance-b', 50);
			expect(settings.values.has('Presence_broadcast_disabled')).toBe(false);

			await instanceConnections('instance-b', 51);
			expect(settings.values.get('Presence_broadcast_disabled')).toBe(true);

			await presence.setStatus('alice', UserStatus.BUSY, 'Focus');
			expect(listener.received).toEqual([]);
			await expect(presence.toggleBroadcast(true)).rejects.toThrow('Cannot enable broadcast when there are more than 200 connections');
		});

		it('should resume broadcasting when a presence or scalability license arrives', async () => {
			aliceIsConnected();
			await instanceConnections('instance-a', 201);
			await emit('license.module', { module: 'livechat-enterprise', valid: true });
			expect(settings.values.get('Presence_broadcast_disabled')).toBe(true);

			await emit('license.module', { module: 'scalability', valid: true });
			await instanceConnections('instance-a', 300);

			expect(settings.values.get('Presence_broadcast_disabled')).toBe(false);
			await presence.setStatus('alice', UserStatus.BUSY, 'Focus');
			expect(broadcastStatuses()).toEqual([UserStatus.BUSY]);
		});
	});

	it('should report current, max and peak connections across instances', async () => {
		await instanceConnections('instance-a', 120);
		await instanceConnections('instance-b', 50);
		await instanceConnections('instance-a', 10);
		expect(presence.getConnectionCount()).toEqual({ current: 60, max: 200 });

		sessionsModel.findByInstanceId.mockReturnValue({ toArray: async () => [] });
		sessionsModel.removeConnectionsFromInstanceId.mockResolvedValue({ modifiedCount: 0 });
		await emit('watch.instanceStatus', { clientAction: 'removed', id: 'instance-b' });

		expect(presence.getConnectionCount()).toEqual({ current: 10, max: 200 });
		expect(presence.getPeakConnections(true)).toBe(170);
		expect(presence.getPeakConnections()).toBe(0);
	});

	it('should end expired statuses on startup, once per expiration, and keep the next one scheduled', async () => {
		const expiredAt = new Date(Date.now() - 1000);
		usersModel.findExpiredStatuses.mockReturnValue([
			alice({ status: UserStatus.BUSY, statusDefault: UserStatus.BUSY, statusSource: 'manual', statusExpiresAt: expiredAt }),
		]);
		usersModel.findNextStatusExpiration.mockResolvedValue({ statusExpiresAt: new Date(Date.now() + 3600_000) });
		aliceIsConnected();

		await presence.started();

		expect(broadcastStatuses()).toEqual([UserStatus.ONLINE]);
		expect(usersModel.updatePresenceAndStatus).toHaveBeenCalledWith('alice', expect.anything(), expect.anything(), {
			statusExpiresAt: expiredAt,
			previousState: { $exists: false },
		});
		await expect(cronJobs.has('presence-status-expiration')).resolves.toBe(true);

		usersModel.findNextStatusExpiration.mockResolvedValue(null);
		await presence.clearActiveState('alice');
		await expect(cronJobs.has('presence-status-expiration')).resolves.toBe(false);
	});
});
