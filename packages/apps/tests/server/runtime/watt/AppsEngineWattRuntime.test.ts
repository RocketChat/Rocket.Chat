import * as assert from 'node:assert';
import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { AppsEngineWattRuntime } from '../../../../src/server/runtime/watt/AppsEngineWattRuntime';
import { WATT_MESSAGE_COMMAND } from '../../../../src/server/runtime/watt/WattRuntimeApi';

const flush = () => new Promise((resolve) => setImmediate(resolve));

/**
 * Minimal Watt runtime double: an EventEmitter exposing the subset of the
 * programmatic API the manager drives, with every method mocked so the tests can
 * assert on lifecycle calls.
 */
function createMockRuntime(metrics: unknown[] = []) {
	const runtime = new EventEmitter() as any;

	runtime.start = mock.fn(async () => 'http://localhost');
	runtime.close = mock.fn(async () => undefined);
	runtime.addApplications = mock.fn(async () => undefined);
	runtime.removeApplications = mock.fn(async () => undefined);
	runtime.startApplication = mock.fn(async () => undefined);
	runtime.stopApplication = mock.fn(async () => undefined);
	runtime.restartApplication = mock.fn(async () => undefined);
	runtime.getApplicationsIds = mock.fn(() => []);
	runtime.sendCommandToApplication = mock.fn(async () => undefined);
	runtime.getMetrics = mock.fn(async () => ({ metrics }));
	runtime.getApplicationResourcesInfo = mock.fn(async () => ({ workers: 1, health: {} }));

	return runtime;
}

function createMockManager() {
	return {
		getLogStorage: () => ({ storeEntries: mock.fn(async () => undefined) }),
		getAccessorManager: () => ({}),
		getApiManager: () => ({}),
		getBridges: () => ({}),
	} as any;
}

function createMockController(appId: string) {
	return {
		getAppId: () => appId,
		isStopping: mock.fn(() => false),
		restartApp: mock.fn(async () => undefined),
		stopApp: mock.fn(async () => undefined),
		handleRuntimeMessage: mock.fn(() => undefined),
	} as any;
}

describe('AppsEngineWattRuntime', () => {
	let runtime: any;

	const instanceFor = (manager: any, options: Record<string, unknown> = {}) =>
		AppsEngineWattRuntime.getInstance(manager, { loadRuntime: async () => ({ create: async () => runtime }), ...options });

	beforeEach(() => {
		runtime = createMockRuntime();
	});

	afterEach(() => {
		mock.restoreAll();
	});

	it('hosts multiple apps in a single shared runtime', async () => {
		const manager = createMockManager();
		const watt = instanceFor(manager);

		await watt.registerApp(createMockController('app-a'));
		await watt.registerApp(createMockController('app-b'));

		// A single runtime is created and started once, shared by both apps
		assert.strictEqual(runtime.start.mock.callCount(), 1);
		assert.strictEqual(runtime.addApplications.mock.callCount(), 2);

		const firstAppId = runtime.addApplications.mock.calls[0].arguments[0][0].id;
		const secondAppId = runtime.addApplications.mock.calls[1].arguments[0][0].id;
		assert.deepStrictEqual([firstAppId, secondAppId], ['app-a', 'app-b']);
	});

	it('sends messages to an app worker via sendCommandToApplication', async () => {
		const manager = createMockManager();
		const watt = instanceFor(manager);

		await watt.registerApp(createMockController('app-a'));
		await watt.sendToApp('app-a', { hello: 'world' });

		assert.strictEqual(runtime.sendCommandToApplication.mock.callCount(), 1);
		assert.deepStrictEqual(runtime.sendCommandToApplication.mock.calls[0].arguments, [
			'app-a',
			WATT_MESSAGE_COMMAND,
			{ hello: 'world' },
		]);
	});

	it('routes inbound worker messages to the matching controller', async () => {
		const manager = createMockManager();
		const watt = instanceFor(manager);

		const controller = createMockController('app-a');
		await watt.registerApp(controller);

		runtime.emit('application:worker:message', { application: 'app-a', message: { jsonrpc: '2.0' } });

		assert.strictEqual(controller.handleRuntimeMessage.mock.callCount(), 1);
		assert.deepStrictEqual(controller.handleRuntimeMessage.mock.calls[0].arguments[0], { jsonrpc: '2.0' });
	});

	it('restarts a worker when Watt reports it failed (no LivenessManager)', async () => {
		const manager = createMockManager();
		const watt = instanceFor(manager);

		const controller = createMockController('app-a');
		await watt.registerApp(controller);

		runtime.emit('application:worker:error', { application: 'app-a', error: new Error('boom') });
		await flush();

		assert.strictEqual(controller.restartApp.mock.callCount(), 1);
		assert.strictEqual(controller.stopApp.mock.callCount(), 0);
	});

	it('gives up and stops the app once the restart limit is reached', async () => {
		const manager = createMockManager();
		const watt = instanceFor(manager, { maxRestarts: 1 });

		const controller = createMockController('app-a');
		await watt.registerApp(controller);

		runtime.emit('application:worker:unhealthy', { application: 'app-a' });
		await flush();
		runtime.emit('application:worker:unhealthy', { application: 'app-a' });
		await flush();

		assert.strictEqual(controller.restartApp.mock.callCount(), 1);
		assert.strictEqual(controller.stopApp.mock.callCount(), 1);
	});

	it('ignores clean worker exits and exits while stopping', async () => {
		const manager = createMockManager();
		const watt = instanceFor(manager);

		const controller = createMockController('app-a');
		await watt.registerApp(controller);

		// Clean exit
		runtime.emit('application:worker:exited', { application: 'app-a', code: 0 });
		// Exit while the controller is intentionally stopping
		controller.isStopping = () => true;
		runtime.emit('application:worker:exited', { application: 'app-a', code: 1, signal: 'SIGKILL' });
		await flush();

		assert.strictEqual(controller.restartApp.mock.callCount(), 0);
	});

	it('collects per-app metrics from Watt', async () => {
		const manager = createMockManager();
		runtime = createMockRuntime([{ application: 'app-a', cpu: 12 }]);
		const watt = instanceFor(manager);

		await watt.registerApp(createMockController('app-a'));

		// Trigger a metrics collection pass directly
		await (watt as any).collectMetrics();

		assert.deepStrictEqual(watt.getMetrics('app-a'), { application: 'app-a', cpu: 12 });
	});

	it('tears down the shared runtime when the last app is removed', async () => {
		const manager = createMockManager();
		const watt = instanceFor(manager);

		await watt.registerApp(createMockController('app-a'));
		await watt.unregisterApp('app-a');

		assert.strictEqual(runtime.stopApplication.mock.callCount(), 1);
		assert.strictEqual(runtime.close.mock.callCount(), 1);
	});
});
