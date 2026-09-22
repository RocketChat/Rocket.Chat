import type { IApiService, IBroker, IServiceMetrics } from '@rocket.chat/core-services';
import { Presence, asyncLocalStorage } from '@rocket.chat/core-services';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Users } from '@rocket.chat/models';
import { NotificationsModule } from '@rocket.chat/streamer';

import { ConnectionRegistry } from './ConnectionRegistry';
import { DDPStreamer } from './DDPStreamer';
import { Server } from './Server';
import { createStreamAdapter } from './Streamer';
import { makeClient, sentPackets } from './__tests__/helpers';
import { ConnectionLifecycle } from './lifecycle';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	Presence: {
		newConnection: jest.fn().mockResolvedValue(undefined),
		removeConnection: jest.fn().mockResolvedValue(undefined),
	},
}));

jest.mock('@rocket.chat/models', () => ({
	...jest.requireActual('@rocket.chat/models'),
	Users: {
		findOneById: jest.fn(),
	},
}));

jest.mock('@rocket.chat/instance-status', () => ({
	...jest.requireActual('@rocket.chat/instance-status'),
	InstanceStatus: {
		updateConnections: jest.fn().mockResolvedValue(undefined),
		registerInstance: jest.fn(),
	},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: jest.fn().mockReturnValue({
		error: jest.fn(),
	}),
}));

const mockFindOneById = jest.mocked(Users.findOneById);

const server = new Server();
const notifications = new NotificationsModule(createStreamAdapter(server));

function makeMetrics(): jest.Mocked<IServiceMetrics> {
	return {
		register: jest.fn(),
		hasMetric: jest.fn(),
		increment: jest.fn(),
		decrement: jest.fn(),
		set: jest.fn(),
		observe: jest.fn(),
		reset: jest.fn(),
		resetAll: jest.fn(),
		timer: jest.fn(),
	};
}

function makeService() {
	const lifecycle = new ConnectionLifecycle();
	const registry = new ConnectionRegistry(lifecycle);
	const service = new DDPStreamer(server, lifecycle, registry, notifications);
	const api = { broadcast: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<IApiService>;
	service.setApi(api);
	const metrics = makeMetrics();

	return { lifecycle, registry, service, api, metrics };
}

async function createService() {
	const context = makeService();
	const broker = { metrics: context.metrics } as unknown as IBroker;

	await asyncLocalStorage.run({ id: 'ctx', requestID: 'req', broker, nodeID: 'node1' }, () => context.service.created());

	return context;
}

async function flushImmediates(): Promise<void> {
	await new Promise(setImmediate);
	await new Promise(setImmediate);
}

describe('DDPStreamer lifecycle handling', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('wires nothing when created outside a broker context', async () => {
		const { service, lifecycle, metrics } = makeService();

		await service.created();

		expect(metrics.register).not.toHaveBeenCalled();
		expect(lifecycle.has('loggedIn')).toBe(false);
		expect(lifecycle.has('loggedOut')).toBe(false);
	});

	it('registers the subscription histogram and the connection gauges', async () => {
		const { metrics } = await createService();

		expect(metrics.register.mock.calls.map(([metric]) => metric.name)).toEqual([
			'rocketchat_subscription',
			'users_connected',
			'users_logged',
		]);
	});

	it('counts a new connection and broadcasts it', async () => {
		const { lifecycle, metrics, api } = await createService();
		const client = makeClient();

		lifecycle.emit('connected', client);

		expect(metrics.increment).toHaveBeenCalledWith('users_connected', { nodeID: 'node1' }, 1);
		expect(api.broadcast).toHaveBeenCalledWith('socket.connected', client.connection);
	});

	it('reports the number of clients still connected when one disconnects', async () => {
		const { lifecycle } = await createService();
		const [first, second] = [makeClient(), makeClient()];
		lifecycle.emit('connected', first);
		lifecycle.emit('connected', second);

		lifecycle.emit('disconnected', first);

		expect(InstanceStatus.updateConnections).toHaveBeenCalledWith(1);
	});

	describe('on user.forceLogout', () => {
		it('closes only the named session when one is given', async () => {
			const { service, registry } = await createService();
			const closeSession = jest.spyOn(registry, 'closeSession');
			const closeForUser = jest.spyOn(registry, 'closeForUser');

			service.emit('user.forceLogout', 'user1', 'session1');

			expect(closeSession).toHaveBeenCalledWith('session1');
			expect(closeForUser).not.toHaveBeenCalled();
		});

		it('closes every session of the user otherwise', async () => {
			const { service, registry } = await createService();
			const closeSession = jest.spyOn(registry, 'closeSession');
			const closeForUser = jest.spyOn(registry, 'closeForUser');

			service.emit('user.forceLogout', 'user1');

			expect(closeForUser).toHaveBeenCalledWith('user1');
			expect(closeSession).not.toHaveBeenCalled();
		});
	});

	describe('on login', () => {
		const user = { _id: 'user1', username: 'joe' };

		it('registers presence, sends the user document after the method result, and broadcasts the login', async () => {
			mockFindOneById.mockResolvedValue(user as any);
			const { lifecycle, metrics, api } = await createService();
			const client = makeClient();

			lifecycle.emit('loggedIn', client);

			expect(metrics.increment).toHaveBeenCalledWith('users_logged', { nodeID: 'node1' }, 1);
			expect(Presence.newConnection).toHaveBeenCalledWith('user1', 'connection1', 'node1');
			expect(client.send).not.toHaveBeenCalled();

			await flushImmediates();

			expect(InstanceStatus.updateConnections).toHaveBeenCalledWith(0);
			expect(jest.mocked(Presence.newConnection).mock.invocationCallOrder[0]).toBeLessThan(mockFindOneById.mock.invocationCallOrder[0]);
			expect(sentPackets(client)).toEqual([{ msg: 'added', collection: 'users', id: 'user1', fields: user }]);
			expect(api.broadcast).toHaveBeenCalledWith('accounts.login', { userId: 'user1', connection: client.connection });
		});

		it('loads the user with the same projection Meteor sends after login', async () => {
			mockFindOneById.mockResolvedValue(user as any);
			const { lifecycle } = await createService();

			lifecycle.emit('loggedIn', makeClient());
			await flushImmediates();

			expect(mockFindOneById).toHaveBeenCalledWith('user1', {
				projection: {
					'name': 1,
					'username': 1,
					'nickname': 1,
					'emails': 1,
					'status': 1,
					'statusDefault': 1,
					'statusText': 1,
					'statusConnection': 1,
					'bio': 1,
					'avatarOrigin': 1,
					'utcOffset': 1,
					'language': 1,
					'settings': 1,
					'enableAutoAway': 1,
					'idleTimeLimit': 1,
					'roles': 1,
					'active': 1,
					'defaultRoom': 1,
					'customFields': 1,
					'requirePasswordChange': 1,
					'requirePasswordChangeReason': 1,
					'statusLivechat': 1,
					'banners': 1,
					'oauth.authorizedClients': 1,
					'_updatedAt': 1,
					'avatarETag': 1,
					'openBusinessHours': 1,
					'services.totp.enabled': 1,
					'services.email2fa.enabled': 1,
				},
			});
		});

		it('still broadcasts the login when the user document is gone', async () => {
			mockFindOneById.mockResolvedValue(null);
			const { lifecycle, api } = await createService();
			const client = makeClient();

			lifecycle.emit('loggedIn', client);
			await flushImmediates();

			expect(client.send).not.toHaveBeenCalled();
			expect(api.broadcast).toHaveBeenCalledWith('accounts.login', { userId: 'user1', connection: client.connection });
		});
	});

	describe('on logout', () => {
		it('broadcasts, refreshes the connection count, and removes presence for the user', async () => {
			const { lifecycle, api } = await createService();
			const client = makeClient();

			lifecycle.emit('loggedOut', client);

			expect(api.broadcast).toHaveBeenCalledWith('accounts.logout', { userId: 'user1', connection: client.connection });
			expect(InstanceStatus.updateConnections).toHaveBeenCalledWith(0);
			expect(Presence.removeConnection).toHaveBeenCalledWith('user1', 'connection1', 'node1');
		});

		it('leaves presence alone for an anonymous client', async () => {
			const { lifecycle, api } = await createService();
			const client = makeClient();
			client.userId = undefined;

			lifecycle.emit('loggedOut', client);

			expect(api.broadcast).toHaveBeenCalledWith('accounts.logout', { userId: undefined, connection: client.connection });
			expect(Presence.removeConnection).not.toHaveBeenCalled();
		});
	});

	describe('on disconnect', () => {
		it('decrements both gauges, broadcasts, and removes presence for a logged in client', async () => {
			const { lifecycle, metrics, api } = await createService();
			const client = makeClient();

			lifecycle.emit('disconnected', client);

			expect(metrics.decrement).toHaveBeenCalledWith('users_connected', { nodeID: 'node1' }, 1);
			expect(metrics.decrement).toHaveBeenCalledWith('users_logged', { nodeID: 'node1' }, 1);
			expect(api.broadcast).toHaveBeenCalledWith('socket.disconnected', client.connection);
			expect(InstanceStatus.updateConnections).toHaveBeenCalledWith(0);
			expect(Presence.removeConnection).toHaveBeenCalledWith('user1', 'connection1', 'node1');
		});

		it('only decrements the connection gauge for an anonymous client', async () => {
			const { lifecycle, metrics } = await createService();
			const client = makeClient();
			client.userId = undefined;

			lifecycle.emit('disconnected', client);

			expect(metrics.decrement).toHaveBeenCalledTimes(1);
			expect(metrics.decrement).toHaveBeenCalledWith('users_connected', { nodeID: 'node1' }, 1);
			expect(Presence.removeConnection).not.toHaveBeenCalled();
		});
	});
});
