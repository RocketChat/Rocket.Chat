import { MeteorError, ServiceClass } from '@rocket.chat/core-services';
import { connect } from 'nats';

import { NatsBroker } from './NatsBroker';
import { FakeNatsConnection } from './fakeNatsConnection';

jest.mock('nats', () => ({
	...jest.requireActual('nats'),
	connect: jest.fn(),
}));

const loginStub = jest.fn().mockResolvedValue({ token: 'ok' });
const onAccountsLogin = jest.fn();

class Accounts extends ServiceClass {
	protected name = 'accounts';

	async login(params: unknown): Promise<unknown> {
		return loginStub(params);
	}

	async explode(): Promise<never> {
		throw new MeteorError('error-too-many-requests', 'slow down', { hint: 42 });
	}
}

class DeviceManagement extends ServiceClass {
	protected name = 'device-management';

	constructor() {
		super();

		this.onEvent('accounts.login', onAccountsLogin);
	}
}

const running: { broker: NatsBroker; services: ServiceClass[] }[] = [];

const start = async (nodeID = 'node-a') => {
	const nc = new FakeNatsConnection();
	(connect as jest.Mock).mockResolvedValue(nc);

	const broker = new NatsBroker({}, nodeID);
	const accounts = new Accounts();
	const deviceManagement = new DeviceManagement();

	await broker.createService(accounts);
	await broker.createService(deviceManagement);
	await broker.start();

	running.push({ broker, services: [accounts, deviceManagement] });

	return { broker, nc, accounts, deviceManagement };
};

beforeEach(() => {
	jest.clearAllMocks();
	loginStub.mockResolvedValue({ token: 'ok' });
});

// registering a non internal service starts a license check interval; leaving it
// running keeps the jest worker alive
afterEach(async () => {
	await Promise.all(running.splice(0).flatMap(({ broker, services }) => services.map((service) => broker.destroyService(service))));
});

describe('NatsBroker subjects', () => {
	it('should expose methods under the rpc prefix and events under the event prefix', async () => {
		const { nc } = await start();

		expect([...nc.endpoints.keys()]).toEqual(expect.arrayContaining(['rpc.accounts.login', 'node.node-a.accounts.login']));
		expect([...nc.subscriptions.keys()]).toContain('event.accounts.login');
	});

	it('should not invoke a service method when an event of the same name is broadcast', async () => {
		const { broker } = await start();

		await broker.broadcast('accounts.login', { userId: 'uid' } as never);

		expect(onAccountsLogin).toHaveBeenCalledWith({ userId: 'uid' });
		expect(loginStub).not.toHaveBeenCalled();
	});

	it('should not notify event listeners when a method of the same name is called', async () => {
		const { broker } = await start();

		await broker.call('accounts.login', [{ resume: 'token' }]);

		expect(loginStub).toHaveBeenCalledWith({ resume: 'token' });
		expect(onAccountsLogin).not.toHaveBeenCalled();
	});
});

describe('NatsBroker.call', () => {
	it('should return the method result', async () => {
		const { broker } = await start();

		await expect(broker.call('accounts.login', [{ resume: 'token' }])).resolves.toEqual({ token: 'ok' });
	});

	it('should resolve undefined when the method returns nothing', async () => {
		loginStub.mockResolvedValue(undefined);
		const { broker } = await start();

		await expect(broker.call('accounts.login', [])).resolves.toBeUndefined();
	});

	it('should route to the node scoped subject when a nodeID is given', async () => {
		const { broker, nc } = await start();

		await broker.call('accounts.login', [], { nodeID: 'node-a' });

		expect(nc.requested).toEqual(['node.node-a.accounts.login']);
	});

	it('should reject rather than hang when the method throws', async () => {
		const { broker } = await start();

		await expect(broker.call('accounts.explode', [])).rejects.toThrow();
	});

	it('should restore a MeteorError across the wire', async () => {
		const { broker } = await start();

		const error = await broker.call('accounts.explode', []).catch((e: unknown) => e);

		expect(error).toBeInstanceOf(MeteorError);
		expect(error).toMatchObject({
			error: 'error-too-many-requests',
			reason: 'slow down',
			details: { hint: 42 },
			isClientSafe: true,
		});
	});
});

describe('NatsBroker discovery', () => {
	it('should report the local node from the service metadata', async () => {
		const { broker } = await start();

		await expect(broker.nodeList()).resolves.toEqual([{ id: 'node-a', available: true, local: true }]);
	});

	it('should report remote nodes as not local', async () => {
		const { broker, nc } = await start();
		nc.addRemoteIdentity('accounts', 'node-b');

		await expect(broker.nodeList()).resolves.toEqual([
			{ id: 'node-a', available: true, local: true },
			{ id: 'node-b', available: true, local: false },
		]);
	});

	it('should answer $node.services with the nodes running each service', async () => {
		const { broker, nc } = await start();
		nc.addRemoteIdentity('accounts', 'node-b');

		await expect(broker.call('$node.services', {})).resolves.toEqual([
			{ name: 'accounts', nodes: ['node-a', 'node-b'] },
			{ name: 'device-management', nodes: ['node-a'] },
		]);
	});

	it('should throw once the connection is closed, so health checks fail', async () => {
		const { broker, nc } = await start();
		nc.close();

		await expect(broker.nodeList()).rejects.toThrow('NatsBroker not connected');
	});

	it('should reduce a node id with dots to a single subject token', async () => {
		const { broker, nc } = await start('host.example.com-1');

		expect([...nc.endpoints.keys()]).toContain('node.host_example_com-1.accounts.login');
		await expect(broker.nodeList()).resolves.toEqual([{ id: 'host_example_com-1', available: true, local: true }]);
	});
});

describe('NatsBroker.destroyService', () => {
	it('should stop the service, drain its subscriptions and run stopped()', async () => {
		const { broker, nc, deviceManagement } = await start();
		const stopped = jest.spyOn(deviceManagement, 'stopped');

		await broker.destroyService(deviceManagement);

		expect(stopped).toHaveBeenCalled();
		expect(nc.stoppedServices).toEqual(['device-management']);
		expect(nc.drainedSubscriptions).toBe(1);
		expect(nc.endpoints.has('rpc.device-management.login')).toBe(false);
	});

	it('should stop delivering local broadcasts to a destroyed service', async () => {
		const { broker, deviceManagement } = await start();

		await broker.destroyService(deviceManagement);
		await broker.broadcastLocal('accounts.login', { userId: 'uid' } as never);

		expect(onAccountsLogin).not.toHaveBeenCalled();
	});
});

describe('NatsBroker.broadcastLocal', () => {
	it('should deliver to registered services without touching the connection', async () => {
		const { broker, nc } = await start();

		await broker.broadcastLocal('accounts.login', { userId: 'uid' } as never);

		expect(onAccountsLogin).toHaveBeenCalledWith({ userId: 'uid' });
		expect(nc.requested).toEqual([]);
	});
});
