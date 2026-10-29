import net from 'node:net';
import { setTimeout as sleep } from 'node:timers/promises';

import { XMPPServerService } from '../../src/service/XMPPServerService';

const settings = new Map<string, unknown>();
const hasModule = jest.fn<Promise<boolean>, [string]>();

jest.mock('@rocket.chat/core-services', () => ({
	ServiceClass: class {
		onEvent = jest.fn();
	},
	License: { hasModule: (module: string) => hasModule(module) },
	Settings: { get: async (key: string) => settings.get(key) },
	api: { broadcast: jest.fn() },
	Message: {},
	Room: {},
}));

jest.mock('@rocket.chat/models', () => ({
	Users: {},
	Rooms: { findByXMPPRole: () => ({ toArray: async () => [] }) },
	Subscriptions: {},
	Messages: {},
}));

jest.mock('@rocket.chat/logger', () => ({
	Logger: class {
		debug = jest.fn();

		info = jest.fn();

		warn = jest.fn();

		error = jest.fn();
	},
}));

jest.setTimeout(30000);

const freePort = (): Promise<number> =>
	new Promise((resolve, reject) => {
		const probe = net.createServer();
		probe.once('error', reject);
		probe.listen(0, '127.0.0.1', () => {
			const { port } = probe.address() as net.AddressInfo;
			probe.close(() => resolve(port));
		});
	});

const waitFor = (check: () => boolean, timeoutMs = 15000): Promise<void> =>
	new Promise((resolve, reject) => {
		const started = Date.now();
		const timer = setInterval(() => {
			if (check()) {
				clearInterval(timer);
				resolve();
			} else if (Date.now() - started > timeoutMs) {
				clearInterval(timer);
				reject(new Error('Timed out'));
			}
		}, 25);
	});

describe('XMPPServerService lifecycle', () => {
	let service: XMPPServerService;

	beforeEach(async () => {
		settings.set('XMPP_Server_Domain', 'a.localhost');
		settings.set('XMPP_Server_Port', await freePort());
		hasModule.mockReset();
		service = new XMPPServerService();
	});

	afterEach(async () => {
		await service.stopped();
	});

	it('starts once the license gains federation, even when no license.module event arrives (configuration-and-lifecycle R14)', async () => {
		settings.set('XMPP_Server_Enabled', true);
		hasModule.mockResolvedValue(false);

		await service.started();
		expect(service.isRunning()).toBe(false);

		hasModule.mockResolvedValue(true);
		await waitFor(() => service.isRunning());
	});

	it('does not read the license again while the feature is switched off (configuration-and-lifecycle R14)', async () => {
		settings.set('XMPP_Server_Enabled', false);
		hasModule.mockResolvedValue(false);

		await service.started();
		await sleep(2500);

		expect(hasModule).toHaveBeenCalledTimes(1);
		expect(service.isRunning()).toBe(false);
	});
});
