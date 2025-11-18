import type { ChildProcess } from 'child_process';
import { mock } from 'node:test';
import { EventEmitter } from 'stream';

import type { RestorableFunctionSpy } from 'alsatian';
import { AsyncTest, Expect, Setup, SetupFixture, SpyOn, Teardown, TeardownFixture, Test, TestFixture } from 'alsatian';
import debugFactory from 'debug';

import type { DenoRuntimeSubprocessController } from '../../../../src/server/runtime/deno/AppsEngineDenoRuntime';
import { COMMAND_PING, LivenessManager } from '../../../../src/server/runtime/deno/LivenessManager';
import { ProcessMessenger } from '../../../../src/server/runtime/deno/ProcessMessenger';

@TestFixture('LivenessManager ping mechanism')
export class LivenessManagerTestFixture {
	private static readonly PING_INTERVAL_MS = 100;

	private static readonly PING_TIMEOUT_MS = 50;

	private static readonly CONSECUTIVE_TIMEOUT_LIMIT = 3;

	private static readonly MAX_RESTARTS = Infinity;

	private static readonly RESTART_ATTEMPT_DELAY_MS = 10;

	private mockController: DenoRuntimeSubprocessController;

	private mockMessenger: ProcessMessenger;

	private mockSubprocess: ChildProcess;

	private debug: debug.Debugger;

	private livenessManager: LivenessManager;

	private controllerEventEmitter: EventEmitter;

	private subprocessEventEmitter: EventEmitter;

	private sendSpy: RestorableFunctionSpy;

	@SetupFixture
	public setupFixture() {
		this.debug = debugFactory('test:liveness-manager');

		mock.timers.enable();
	}

	@TeardownFixture
	public teardownFixture() {
		mock.timers.reset();
	}

	@Setup
	public setup() {
		mock.timers.setTime(0);

		// Create event emitters for controller and subprocess
		this.controllerEventEmitter = new EventEmitter();
		this.subprocessEventEmitter = new EventEmitter();

		// Mock controller
		this.mockController = {
			getProcessState: () => 'ready',
			restartApp: async () => Promise.resolve(),
			stopApp: async () => Promise.resolve(),
			on: (event: string, listener: (...args: any[]) => void) => {
				this.controllerEventEmitter.on(event, listener);
				return this.mockController;
			},
			once: (event: string, listener: (...args: any[]) => void) => {
				this.controllerEventEmitter.once(event, listener);
				return this.mockController;
			},
			off: (event: string, listener: (...args: any[]) => void) => {
				this.controllerEventEmitter.off(event, listener);
				return this.mockController;
			},
			emit: (event: string, ...args: any[]) => {
				return this.controllerEventEmitter.emit(event, ...args);
			},
			addListener: () => this.mockController,
			removeListener: () => this.mockController,
			removeAllListeners: () => this.mockController,
			setMaxListeners: () => this.mockController,
			getMaxListeners: () => 10,
			listeners: (): any[] => [],
			rawListeners: (): any[] => [],
			listenerCount: (): number => 0,
			prependListener: () => this.mockController,
			prependOnceListener: () => this.mockController,
			eventNames: (): string[] => [],
		} as unknown as DenoRuntimeSubprocessController;

		// Mock subprocess
		this.mockSubprocess = {
			pid: 12345,
			once: (event: string, listener: (...args: any[]) => void) => {
				this.subprocessEventEmitter.once(event, listener);
				return this.mockSubprocess;
			},
			on: () => this.mockSubprocess,
			off: () => this.mockSubprocess,
			emit: (event: string, ...args: any[]) => {
				return this.subprocessEventEmitter.emit(event, ...args);
			},
		} as unknown as ChildProcess;

		// Mock messenger
		this.mockMessenger = new ProcessMessenger();
		this.mockMessenger.setReceiver(this.mockSubprocess);

		this.sendSpy = SpyOn(this.mockMessenger, 'send');
		this.sendSpy.andStub();

		// Create LivenessManager with fast ping options for testing
		this.livenessManager = new LivenessManager(
			{
				controller: this.mockController,
				messenger: this.mockMessenger,
				debug: this.debug,
			},
			{
				pingTimeoutInMS: LivenessManagerTestFixture.PING_TIMEOUT_MS,
				pingIntervalInMS: LivenessManagerTestFixture.PING_INTERVAL_MS,
				consecutiveTimeoutLimit: LivenessManagerTestFixture.CONSECUTIVE_TIMEOUT_LIMIT,
				maxRestarts: LivenessManagerTestFixture.MAX_RESTARTS,
				restartAttemptDelayInMS: LivenessManagerTestFixture.RESTART_ATTEMPT_DELAY_MS,
			},
		);

		this.livenessManager.attach(this.mockSubprocess);
	}

	@Teardown
	public teardown() {
		// Stop the liveness manager to clean up intervals
		this.livenessManager.stop();

		// Clear all event listeners
		this.controllerEventEmitter.removeAllListeners();
		this.subprocessEventEmitter.removeAllListeners();

		this.sendSpy.restore();
	}

	@Test('should update lastHeartbeatTimestamp when heartbeat event is emitted')
	public testHeartbeatUpdatesTimestamp() {
		this.controllerEventEmitter.emit('constructed');

		const initialTimestamp = this.livenessManager.getRuntimeData().lastHeartbeatTimestamp;

		Expect(initialTimestamp).toBe(0);

		mock.timers.tick(50);

		this.controllerEventEmitter.emit('heartbeat');

		const newTimestamp = this.livenessManager.getRuntimeData().lastHeartbeatTimestamp;
		Expect(newTimestamp).toBe(50);
	}

	@Test('should ping when heartbeat is stale')
	public testPingWhenHeartbeatStale() {
		this.controllerEventEmitter.emit('constructed');

		mock.timers.tick(LivenessManagerTestFixture.PING_INTERVAL_MS);

		Expect(this.sendSpy).toHaveBeenCalledWith(COMMAND_PING);
	}

	@Test('should not ping when heartbeat is recent')
	public testNoPingWhenHeartbeatRecent() {
		this.controllerEventEmitter.emit('constructed');

		// Wait half the interval to update the heartbeat
		mock.timers.tick(LivenessManagerTestFixture.PING_INTERVAL_MS / 2);

		this.controllerEventEmitter.emit('heartbeat');

		// Wait for the rest of the interval that would trigger the ping
		mock.timers.tick(LivenessManagerTestFixture.PING_INTERVAL_MS / 2);

		// Ping should not have been sent
		Expect(this.sendSpy).not.toHaveBeenCalled();
	}

	@Test('should handle successful ping/pong')
	public testSuccessfulPingPong() {
		this.controllerEventEmitter.emit('constructed');

		// Wait for the full interval
		mock.timers.tick(LivenessManagerTestFixture.PING_INTERVAL_MS);

		// Verify ping was sent
		Expect(this.sendSpy).toHaveBeenCalledWith(COMMAND_PING);

		// Advance time to simulate latency
		mock.timers.tick(20);

		// Emit pong response
		this.controllerEventEmitter.emit('pong');

		// Verify consecutive timeout count was reset
		const runtimeData = this.livenessManager.getRuntimeData();
		Expect(runtimeData.pingTimeoutConsecutiveCount).toBe(0);

		// Verify heartbeat timestamp was updated
		const newTimestamp = runtimeData.lastHeartbeatTimestamp;
		Expect(newTimestamp).toBe(LivenessManagerTestFixture.PING_INTERVAL_MS + 20);
	}

	@Test('should keep track of consecutive timeouts, and clear the count on a heartbeat')
	public testConsecutiveTimeouts() {
		this.controllerEventEmitter.emit('constructed');

		// Wait for the full interval
		mock.timers.tick(LivenessManagerTestFixture.PING_INTERVAL_MS);

		// Verify ping was sent
		Expect(this.sendSpy).toHaveBeenCalledWith(COMMAND_PING);

		// Timeout the ping
		mock.timers.tick(LivenessManagerTestFixture.PING_TIMEOUT_MS);

		// Verify consecutive timeout count incremented
		let runtimeData = this.livenessManager.getRuntimeData();
		Expect(runtimeData.pingTimeoutConsecutiveCount).toBe(1);

		// Tick the rest of the interval to next ping
		mock.timers.tick(LivenessManagerTestFixture.PING_INTERVAL_MS - LivenessManagerTestFixture.PING_TIMEOUT_MS);

		// Verify ping was sent
		Expect(this.sendSpy).toHaveBeenCalled().exactly(2).times;

		// Timeout the ping
		mock.timers.tick(LivenessManagerTestFixture.PING_TIMEOUT_MS);

		// Verify consecutive timeout count incremented
		runtimeData = this.livenessManager.getRuntimeData();
		Expect(runtimeData.pingTimeoutConsecutiveCount).toBe(2);

		this.controllerEventEmitter.emit('heartbeat');

		mock.timers.tick(LivenessManagerTestFixture.PING_INTERVAL_MS - LivenessManagerTestFixture.PING_TIMEOUT_MS);

		// Shouldn't have called ping due to recent heartbeat
		Expect(this.sendSpy).toHaveBeenCalled().exactly(2).times;

		// Verify consecutive timeout count was reset
		runtimeData = this.livenessManager.getRuntimeData();
		Expect(runtimeData.pingTimeoutConsecutiveCount).toBe(0);
	}

	@AsyncTest('should call restart when consecutive timeout count reaches limit from options')
	public async testRestartOnConsecutiveTimeoutsLimit() {
		(this.livenessManager as any).options.consecutiveTimeoutLimit = 2;
		const spy = SpyOn(this.livenessManager, 'restartProcess');
		spy.andStub();

		this.controllerEventEmitter.emit('constructed');

		// Wait for the full interval
		mock.timers.tick(LivenessManagerTestFixture.PING_INTERVAL_MS);

		// Verify ping was sent
		Expect(this.sendSpy).toHaveBeenCalledWith(COMMAND_PING);

		// Timeout the ping
		mock.timers.tick(LivenessManagerTestFixture.PING_TIMEOUT_MS);

		// Verify consecutive timeout count incremented
		let runtimeData = this.livenessManager.getRuntimeData();
		Expect(runtimeData.pingTimeoutConsecutiveCount).toBe(1);

		// Wait for ping handler to finish
		await this.livenessManager.getPendingPing();

		// Tick the rest of the interval to next ping
		mock.timers.tick(LivenessManagerTestFixture.PING_INTERVAL_MS - LivenessManagerTestFixture.PING_TIMEOUT_MS);

		// Verify ping was sent
		Expect(this.sendSpy).toHaveBeenCalled().exactly(2).times;

		// Timeout the ping
		mock.timers.tick(LivenessManagerTestFixture.PING_TIMEOUT_MS);

		// Wait for ping handler to finish
		await this.livenessManager.getPendingPing();

		// Verify consecutive timeout count incremented
		runtimeData = this.livenessManager.getRuntimeData();
		Expect(runtimeData.pingTimeoutConsecutiveCount).toBe(2);

		// Verify that restart has been called due to reaching consecutive timeout limit
		Expect(spy).toHaveBeenCalledWith('Too many pings timed out');

		spy.restore();
	}
}
