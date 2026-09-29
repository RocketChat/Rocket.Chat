import type { IApiService, IBroker, IServiceMetrics } from '@rocket.chat/core-services';
import { Presence, asyncLocalStorage } from '@rocket.chat/core-services';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Users } from '@rocket.chat/models';
import { NotificationsModule } from '@rocket.chat/streamer';

import { DDPStreamer } from './DDPStreamer';
import { makeSession, sentPackets } from './__tests__/helpers';
import { ConnectionRegistry } from './ddp/ConnectionRegistry';
import { Server } from './ddp/Server';
import { ConnectionLifecycle } from './ddp/lifecycle';
import { MeteorCollection } from './lib/MeteorCollection';
import { createStreamAdapter } from './streams/StreamAdapter';

jest.mock('@rocket.chat/core-services', () => ({
	...jest.requireActual('@rocket.chat/core-services'),
	Presence: {
		newConnection: jest.fn().mockResolvedValue(undefined),
		removeConnection: jest.fn().mockResolvedValue(undefined),
		updateConnection: jest.fn().mockResolvedValue(undefined),
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
const notifications = new NotificationsModule(createStreamAdapter(server), 'self');

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
	const collections = { loginServices: new MeteorCollection<any>(), clientVersions: new MeteorCollection<any>() };
	const service = new DDPStreamer(server, lifecycle, registry, collections, notifications);
	const api = { broadcast: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<IApiService>;
	service.setApi(api);
	const metrics = makeMetrics();

	return { lifecycle, registry, collections, service, api, metrics };
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

async function flushMicrotasks(): Promise<void> {
	for (let hop = 0; hop < 10; hop++) {
		await Promise.resolve();
	}
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
		const session = makeSession();

		lifecycle.emit('connected', session);

		expect(metrics.increment).toHaveBeenCalledWith('users_connected', { nodeID: 'node1' }, 1);
		expect(api.broadcast).toHaveBeenCalledWith('socket.connected', session.connection);
	});

	it('reports the number of clients still connected when one disconnects', async () => {
		const { lifecycle } = await createService();
		const [first, second] = [makeSession(), makeSession()];
		lifecycle.emit('connected', first);
		lifecycle.emit('connected', second);

		lifecycle.emit('disconnected', first);

		expect(InstanceStatus.updateConnections).toHaveBeenCalledWith(1);
	});

	describe('collections fed by broker events', () => {
		it('applies login service configuration changes to the collection', () => {
			const { service, collections } = makeService();
			const record = { _id: 'google', service: 'google', clientId: 'x' };

			service.emit('watch.loginServiceConfiguration', { clientAction: 'inserted', id: 'google', data: record });
			expect([...collections.loginServices.entries()]).toEqual([['google', record]]);

			service.emit('watch.loginServiceConfiguration', { clientAction: 'removed', id: 'google' });
			expect([...collections.loginServices.entries()]).toEqual([]);
		});

		it('stores session versions by architecture without repeating the id in the record', () => {
			const { service, collections } = makeService();

			service.emit('meteor.clientVersionUpdated', {
				_id: 'web.browser',
				version: 'v2',
				versionRefreshable: 'r2',
				versionNonRefreshable: 'n2',
				versionHmr: 2,
			});

			expect([...collections.clientVersions.entries()]).toEqual([
				['web.browser', { version: 'v2', versionRefreshable: 'r2', versionNonRefreshable: 'n2', versionHmr: 2 }],
			]);
		});
	});

	describe('on activity', () => {
		it('refreshes presence for a logged in session', async () => {
			const { lifecycle } = await createService();
			const session = makeSession();

			lifecycle.emit('activity', session);

			expect(Presence.updateConnection).toHaveBeenCalledWith('user1', 'connection1');
		});

		it('ignores anonymous clients', async () => {
			const { lifecycle } = await createService();
			const session = makeSession();
			session.userId = undefined;

			lifecycle.emit('activity', session);

			expect(Presence.updateConnection).not.toHaveBeenCalled();
		});
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
			const session = makeSession();

			lifecycle.emit('loggedIn', session);

			expect(metrics.increment).toHaveBeenCalledWith('users_logged', { nodeID: 'node1' }, 1);
			expect(Presence.newConnection).toHaveBeenCalledWith('user1', 'connection1', 'node1');

			// The method result goes out a few microtasks after loggedIn, so the user document must wait for the next macrotask.
			await flushMicrotasks();
			expect(session.send).not.toHaveBeenCalled();

			await flushImmediates();

			expect(InstanceStatus.updateConnections).toHaveBeenCalledWith(0);
			expect(jest.mocked(Presence.newConnection).mock.invocationCallOrder[0]).toBeLessThan(mockFindOneById.mock.invocationCallOrder[0]);
			expect(sentPackets(session)).toEqual([{ msg: 'added', collection: 'users', id: 'user1', fields: user }]);
			expect(api.broadcast).toHaveBeenCalledWith('accounts.login', { userId: 'user1', connection: session.connection });
		});

		it('loads the user with the same projection Meteor sends after login', async () => {
			mockFindOneById.mockResolvedValue(user as any);
			const { lifecycle } = await createService();

			lifecycle.emit('loggedIn', makeSession());
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
			const session = makeSession();

			lifecycle.emit('loggedIn', session);
			await flushImmediates();

			expect(session.send).not.toHaveBeenCalled();
			expect(api.broadcast).toHaveBeenCalledWith('accounts.login', { userId: 'user1', connection: session.connection });
		});
	});

	describe('on logout', () => {
		it('broadcasts, refreshes the connection count, and removes presence for the user', async () => {
			const { lifecycle, api } = await createService();
			const session = makeSession();

			lifecycle.emit('loggedOut', session);

			expect(api.broadcast).toHaveBeenCalledWith('accounts.logout', { userId: 'user1', connection: session.connection });
			expect(InstanceStatus.updateConnections).toHaveBeenCalledWith(0);
			expect(Presence.removeConnection).toHaveBeenCalledWith('user1', 'connection1', 'node1');
		});

		it('leaves presence alone for an anonymous session', async () => {
			const { lifecycle, api } = await createService();
			const session = makeSession();
			session.userId = undefined;

			lifecycle.emit('loggedOut', session);

			expect(api.broadcast).toHaveBeenCalledWith('accounts.logout', { userId: undefined, connection: session.connection });
			expect(Presence.removeConnection).not.toHaveBeenCalled();
		});
	});

	describe('on disconnect', () => {
		it('decrements both gauges, broadcasts, and removes presence for a logged in session', async () => {
			const { lifecycle, metrics, api } = await createService();
			const session = makeSession();

			lifecycle.emit('disconnected', session);

			expect(metrics.decrement).toHaveBeenCalledWith('users_connected', { nodeID: 'node1' }, 1);
			expect(metrics.decrement).toHaveBeenCalledWith('users_logged', { nodeID: 'node1' }, 1);
			expect(api.broadcast).toHaveBeenCalledWith('socket.disconnected', session.connection);
			expect(InstanceStatus.updateConnections).toHaveBeenCalledWith(0);
			expect(Presence.removeConnection).toHaveBeenCalledWith('user1', 'connection1', 'node1');
		});

		it('only decrements the connection gauge for an anonymous session', async () => {
			const { lifecycle, metrics } = await createService();
			const session = makeSession();
			session.userId = undefined;

			lifecycle.emit('disconnected', session);

			expect(metrics.decrement).toHaveBeenCalledTimes(1);
			expect(metrics.decrement).toHaveBeenCalledWith('users_connected', { nodeID: 'node1' }, 1);
			expect(Presence.removeConnection).not.toHaveBeenCalled();
		});
	});
});
