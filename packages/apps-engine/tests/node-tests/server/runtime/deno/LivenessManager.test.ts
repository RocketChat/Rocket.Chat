import type { ChildProcess } from 'child_process';
import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import * as assert from 'node:assert';
import { EventEmitter } from 'stream';
import debugFactory from 'debug';

import type { DenoRuntimeSubprocessController } from '../../../../../src/server/runtime/deno/AppsEngineDenoRuntime';
import { COMMAND_PING, LivenessManager } from '../../../../../src/server/runtime/deno/LivenessManager';
import { ProcessMessenger } from '../../../../../src/server/runtime/deno/ProcessMessenger';

describe('LivenessManager ping mechanism', () => {
	const PING_INTERVAL_MS = 100;
	const PING_TIMEOUT_MS = 50;
	const CONSECUTIVE_TIMEOUT_LIMIT = 3;
	const MAX_RESTARTS = Infinity;
	const RESTART_ATTEMPT_DELAY_MS = 10;

	let mockController: DenoRuntimeSubprocessController;
	let mockMessenger: ProcessMessenger;
	let mockSubprocess: ChildProcess;
	let debug: debug.Debugger;
	let livenessManager: LivenessManager;
	let controllerEventEmitter: EventEmitter;
	let subprocessEventEmitter: EventEmitter;
	let sendMock: it.Mock<ProcessMessenger['send']>;

	beforeEach(() => {
		debug = debugFactory('test:liveness-manager');
		mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
		mock.timers.setTime(0);

		// Create event emitters for controller and subprocess
		controllerEventEmitter = new EventEmitter();
		subprocessEventEmitter = new EventEmitter();

		// Mock controller
		mockController = {
			getProcessState: () => 'ready',
			restartApp: async () => Promise.resolve(),
			stopApp: async () => Promise.resolve(),
			on: (event: string, listener: (...args: any[]) => void) => {
				controllerEventEmitter.on(event, listener);
				return mockController;
			},
			once: (event: string, listener: (...args: any[]) => void) => {
				controllerEventEmitter.once(event, listener);
				return mockController;
			},
			off: (event: string, listener: (...args: any[]) => void) => {
				controllerEventEmitter.off(event, listener);
				return mockController;
			},
			emit: (event: string, ...args: any[]) => {
				return controllerEventEmitter.emit(event, ...args);
			},
			addListener: () => mockController,
			removeListener: () => mockController,
			removeAllListeners: () => mockController,
			setMaxListeners: () => mockController,
			getMaxListeners: () => 10,
			listeners: (): any[] => [],
			rawListeners: (): any[] => [],
			listenerCount: (): number => 0,
			prependListener: () => mockController,
			prependOnceListener: () => mockController,
			eventNames: (): string[] => [],
		} as unknown as DenoRuntimeSubprocessController;

		// Mock subprocess
		mockSubprocess = {
			pid: 12345,
			once: (event: string, listener: (...args: any[]) => void) => {
				subprocessEventEmitter.once(event, listener);
				return mockSubprocess;
			},
			on: () => mockSubprocess,
			off: () => mockSubprocess,
			emit: (event: string, ...args: any[]) => {
				return subprocessEventEmitter.emit(event, ...args);
			},
		} as unknown as ChildProcess;

		// Mock messenger
		mockMessenger = new ProcessMessenger();
		mockMessenger.setReceiver(mockSubprocess);

		sendMock = mock.method(mockMessenger, 'send', () => Promise.resolve());

		// Create LivenessManager with fast ping options for testing
		livenessManager = new LivenessManager(
			{
				controller: mockController,
				messenger: mockMessenger,
				debug,
			},
			{
				pingTimeoutInMS: PING_TIMEOUT_MS,
				pingIntervalInMS: PING_INTERVAL_MS,
				consecutiveTimeoutLimit: CONSECUTIVE_TIMEOUT_LIMIT,
				maxRestarts: MAX_RESTARTS,
				restartAttemptDelayInMS: RESTART_ATTEMPT_DELAY_MS,
			},
		);

		livenessManager.attach(mockSubprocess);
	});

	afterEach(() => {
		// Stop the liveness manager to clean up intervals
		livenessManager.stop();

		// Clear all event listeners
		controllerEventEmitter.removeAllListeners();
		subprocessEventEmitter.removeAllListeners();

		mock.timers.reset();
		sendMock.mock.restore();
	});

	it('should update lastHeartbeatTimestamp when heartbeat event is emitted', () => {
		controllerEventEmitter.emit('constructed');

		const initialTimestamp = livenessManager.getRuntimeData().lastHeartbeatTimestamp;
		assert.strictEqual(initialTimestamp, 0);

		mock.timers.tick(50);

		controllerEventEmitter.emit('heartbeat');

		const newTimestamp = livenessManager.getRuntimeData().lastHeartbeatTimestamp;
		assert.strictEqual(newTimestamp, 50);
	});

	it('should ping when heartbeat is stale', () => {
		controllerEventEmitter.emit('constructed');

		mock.timers.tick(PING_INTERVAL_MS);

		assert.strictEqual(sendMock.mock.calls.length, 1);
		assert.deepStrictEqual(sendMock.mock.calls[0].arguments, [COMMAND_PING]);
	});

	it('should not ping when heartbeat is recent', () => {
		controllerEventEmitter.emit('constructed');

		// Wait half the interval to update the heartbeat
		mock.timers.tick(PING_INTERVAL_MS / 2);

		controllerEventEmitter.emit('heartbeat');

		// Wait for the rest of the interval that would trigger the ping
		mock.timers.tick(PING_INTERVAL_MS / 2);

		// Ping should not have been sent
		assert.strictEqual(sendMock.mock.calls.length, 0);
	});

	it('should handle successful ping/pong', () => {
		controllerEventEmitter.emit('constructed');

		// Wait for the full interval
		mock.timers.tick(PING_INTERVAL_MS);

		// Verify ping was sent
		assert.strictEqual(sendMock.mock.calls.length, 1);
		assert.deepStrictEqual(sendMock.mock.calls[0].arguments, [COMMAND_PING]);

		// Advance time to simulate latency
		mock.timers.tick(20);

		// Emit pong response
		controllerEventEmitter.emit('pong');

		// Verify consecutive timeout count was reset
		const runtimeData = livenessManager.getRuntimeData();
		assert.strictEqual(runtimeData.pingTimeoutConsecutiveCount, 0);

		// Verify heartbeat timestamp was updated
		const newTimestamp = runtimeData.lastHeartbeatTimestamp;
		assert.strictEqual(newTimestamp, PING_INTERVAL_MS + 20);
	});

	it('should keep track of consecutive timeouts, and clear the count on a heartbeat', () => {
		controllerEventEmitter.emit('constructed');

		// Wait for the full interval
		mock.timers.tick(PING_INTERVAL_MS);

		// Verify ping was sent
		assert.strictEqual(sendMock.mock.calls.length, 1);
		assert.deepStrictEqual(sendMock.mock.calls[0].arguments, [COMMAND_PING]);

		// Timeout the ping
		mock.timers.tick(PING_TIMEOUT_MS);

		// Verify consecutive timeout count incremented
		let runtimeData = livenessManager.getRuntimeData();
		assert.strictEqual(runtimeData.pingTimeoutConsecutiveCount, 1);

		// Tick the rest of the interval to next ping
		mock.timers.tick(PING_INTERVAL_MS - PING_TIMEOUT_MS);

		// Verify ping was sent
		assert.strictEqual(sendMock.mock.calls.length, 2);

		// Timeout the ping
		mock.timers.tick(PING_TIMEOUT_MS);

		// Verify consecutive timeout count incremented
		runtimeData = livenessManager.getRuntimeData();
		assert.strictEqual(runtimeData.pingTimeoutConsecutiveCount, 2);

		controllerEventEmitter.emit('heartbeat');

		mock.timers.tick(PING_INTERVAL_MS - PING_TIMEOUT_MS);

		// Shouldn't have called ping due to recent heartbeat
		assert.strictEqual(sendMock.mock.calls.length, 2);

		// Verify consecutive timeout count was reset
		runtimeData = livenessManager.getRuntimeData();
		assert.strictEqual(runtimeData.pingTimeoutConsecutiveCount, 0);
	});

	it('should call restart when consecutive timeout count reaches limit from options', async () => {
		(livenessManager as any).options.consecutiveTimeoutLimit = 2;
		const restartSpy = mock.method(livenessManager as any, 'restartProcess', () => Promise.resolve());

		controllerEventEmitter.emit('constructed');

		// Wait for the full interval
		mock.timers.tick(PING_INTERVAL_MS);

		// Verify ping was sent
		assert.strictEqual(sendMock.mock.calls.length, 1);
		assert.deepStrictEqual(sendMock.mock.calls[0].arguments, [COMMAND_PING]);

		// Timeout the ping
		mock.timers.tick(PING_TIMEOUT_MS);

		// Verify consecutive timeout count incremented
		let runtimeData = livenessManager.getRuntimeData();
		assert.strictEqual(runtimeData.pingTimeoutConsecutiveCount, 1);

		// Wait for ping handler to finish
		await livenessManager.getPendingPing();

		// Tick the rest of the interval to next ping
		mock.timers.tick(PING_INTERVAL_MS - PING_TIMEOUT_MS);

		// Verify ping was sent
		assert.strictEqual(sendMock.mock.calls.length, 2);

		// Timeout the ping
		mock.timers.tick(PING_TIMEOUT_MS);

		// Wait for ping handler to finish
		await livenessManager.getPendingPing();

		// Verify consecutive timeout count incremented
		runtimeData = livenessManager.getRuntimeData();
		assert.strictEqual(runtimeData.pingTimeoutConsecutiveCount, 2);

		// Verify that restart has been called due to reaching consecutive timeout limit
		assert.strictEqual(restartSpy.mock.calls.length, 1);
		assert.deepStrictEqual(restartSpy.mock.calls[0].arguments, ['Too many pings timed out']);

		restartSpy.mock.restore();
	});
});
