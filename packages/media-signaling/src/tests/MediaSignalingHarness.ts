import type { FakeSignalingServerOptions } from './FakeSignalingServer';
import { FakeSignalingServer } from './FakeSignalingServer';
import type { HarnessClientOptions } from './HarnessClient';
import { HarnessClient } from './HarnessClient';
import type { FakeWebRTCOptions } from './webrtc/FakeRTCPeerConnection';
import type { FakeWebRTCController } from './webrtc/installFakeWebRTC';
import { installFakeWebRTC } from './webrtc/installFakeWebRTC';

export type MediaSignalingHarnessOptions = {
	server?: FakeSignalingServerOptions;
	webrtc?: Partial<FakeWebRTCOptions>;
};

export type WaitForOptions = {
	/** Virtual milliseconds to spend before giving up. */
	timeout?: number;
	/** Named in the error message when the condition never holds. */
	label?: string;
};

/**
 * `settle()` alternates between delivering signals and letting short timers run. One millisecond is
 * the smallest step that still releases the 1ms timer the WebRTC processor uses while it waits for
 * ICE gathering.
 */
const SETTLE_TICK_MS = 1;
const SETTLE_ROUNDS = 200;

const WAIT_STEP_MS = 25;
const WAIT_TIMEOUT_MS = 5000;

const ADVANCE_SLICE_MS = 100;

/**
 * Drives whole call flows across several real signaling sessions.
 *
 * The harness owns the fake signaling server, the fake WebRTC stack and the clients, and it hides
 * the interleaving of queued signals, promises and timers behind `settle`, `advance` and `waitFor`.
 * It requires Jest's fake timers: call `jest.useFakeTimers()` before creating one, or use
 * `setupMediaSignalingHarness()`, which does that and the cleanup.
 */
export class MediaSignalingHarness {
	public readonly server: FakeSignalingServer;

	public readonly webrtc: FakeWebRTCController;

	public readonly clients: HarnessClient[] = [];

	private disposed = false;

	constructor(options: MediaSignalingHarnessOptions = {}) {
		this.server = new FakeSignalingServer(options.server);
		this.webrtc = installFakeWebRTC(options.webrtc);
	}

	/** Creates a session and returns once the server has confirmed its registration. */
	public async createClient(options: HarnessClientOptions): Promise<HarnessClient> {
		const { userId, username, displayName } = options;
		this.server.setUserInfo(userId, {
			username: username || userId,
			displayName: displayName || username || userId,
		});

		const sessionsOfUser = this.clients.filter((client) => client.userId === userId).length;
		const label = options.label || (sessionsOfUser ? `${userId}-${sessionsOfUser + 1}` : userId);

		const client = new HarnessClient({ ...options, label }, this.server.createEndpoint(userId), () => this.settle());
		this.clients.push(client);

		await this.waitFor(() => client.registered, { label: `${userId} to register` });

		return client;
	}

	/** Delivers every pending signal and releases the short timers they schedule. */
	public async settle(): Promise<void> {
		for (let round = 0; round < SETTLE_ROUNDS; round++) {
			const delivered = await this.server.flush();

			await jest.advanceTimersByTimeAsync(SETTLE_TICK_MS);

			if (!delivered && !this.server.pendingCount) {
				return;
			}
		}

		throw new Error(`The media signaling harness kept exchanging signals for ${SETTLE_ROUNDS} rounds; the flow does not converge.`);
	}

	/**
	 * Moves the clock forward, delivering signals as the timers they fire produce them.
	 *
	 * A signal a timer produces reaches its session at the end of the slice it was queued in, so a
	 * smaller `sliceMs` interleaves timers and signals more finely at the cost of a slower test.
	 */
	public async advance(ms: number, { sliceMs = ADVANCE_SLICE_MS }: { sliceMs?: number } = {}): Promise<void> {
		for (let remaining = ms; remaining > 0; remaining -= sliceMs) {
			await jest.advanceTimersByTimeAsync(Math.min(remaining, sliceMs));
			await this.server.flush();
		}

		await this.settle();
	}

	public async waitFor(condition: () => boolean, options: WaitForOptions = {}): Promise<void> {
		const { timeout = WAIT_TIMEOUT_MS, label } = options;

		await this.settle();

		for (let waited = 0; waited <= timeout; waited += WAIT_STEP_MS) {
			if (condition()) {
				return;
			}

			await this.advance(WAIT_STEP_MS);
		}

		throw new Error(`Timed out after ${timeout}ms waiting for ${label || 'a condition'}.`);
	}

	public dispose(): void {
		if (this.disposed) {
			return;
		}

		this.disposed = true;

		for (const client of this.clients) {
			client.dispose();
		}

		this.clients.length = 0;
		this.webrtc.uninstall();
	}
}

export const createMediaSignalingHarness = (options?: MediaSignalingHarnessOptions): MediaSignalingHarness =>
	new MediaSignalingHarness(options);

/**
 * Wires the fake timers and the harness lifecycle into the surrounding `describe`, and returns a
 * getter for the harness of the current test.
 */
export const setupMediaSignalingHarness = (options?: MediaSignalingHarnessOptions): (() => MediaSignalingHarness) => {
	let harness: MediaSignalingHarness | null = null;

	beforeEach(() => {
		jest.useFakeTimers();
		harness = new MediaSignalingHarness(options);
	});

	afterEach(() => {
		harness?.dispose();
		harness = null;

		jest.clearAllTimers();
		jest.useRealTimers();
	});

	return () => {
		if (!harness) {
			throw new Error('The media signaling harness is only available inside a test.');
		}

		return harness;
	};
};
