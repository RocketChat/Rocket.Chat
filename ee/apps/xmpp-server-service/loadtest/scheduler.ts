import { monitorEventLoopDelay } from 'node:perf_hooks';

export type LoopResult = {
	sent: number;
	sendErrors: number;
	elapsedMs: number;
	/** The generator's own event-loop delay; when high, a missed target is the generator's fault. */
	generatorLagP99Ms: number;
};

export type Loop = {
	/** Sends fired so far, readable while the loop runs. */
	readonly sent: number;
	readonly done: Promise<LoopResult>;
};

export type LoopOptions = {
	durationMs: number;
	/** How many sends should have been fired in total by now; the loop fires the difference. */
	target: (elapsedMs: number) => number;
	send: () => Promise<void>;
	onSendError: (error: unknown) => void;
	/** Ends the loop early, e.g. on Ctrl-C. */
	shouldStop: () => boolean;
};

const TICK_MS = 10;
// Keeps one tick from blocking the generator for long when the target jumps
const MAX_SENDS_PER_TICK = 5000;
const LAG_RESOLUTION_MS = 10;

/** Event-loop delay above the sampling interval, which the histogram counts as delay too. */
export const loopLagP99Ms = (histogram: { percentile(p: number): number }, resolutionMs: number): number =>
	Math.max(0, histogram.percentile(99) / 1e6 - resolutionMs);

/** Fires `send` whenever the running total falls behind `target`, never waiting for a send to complete. */
export function startLoop({ durationMs, target, send, onSendError, shouldStop }: LoopOptions): Loop {
	const loopDelay = monitorEventLoopDelay({ resolution: LAG_RESOLUTION_MS });
	loopDelay.enable();

	const counters = { sent: 0, sendErrors: 0 };
	const startedAt = performance.now();

	const done = new Promise<LoopResult>((resolve) => {
		const timer = setInterval(() => {
			const elapsed = Math.min(performance.now() - startedAt, durationMs);
			const stopping = elapsed >= durationMs || shouldStop();
			const due = stopping ? 0 : Math.min(Math.floor(target(elapsed)) - counters.sent, MAX_SENDS_PER_TICK);
			for (let i = 0; i < due; i++) {
				counters.sent++;
				send().catch((error) => {
					counters.sendErrors++;
					onSendError(error);
				});
			}
			if (stopping) {
				clearInterval(timer);
				loopDelay.disable();
				resolve({
					...counters,
					elapsedMs: performance.now() - startedAt,
					generatorLagP99Ms: loopLagP99Ms(loopDelay, LAG_RESOLUTION_MS),
				});
			}
		}, TICK_MS);
	});

	return {
		get sent() {
			return counters.sent;
		},
		done,
	};
}

/**
 * Constant arrival rate: the offered load does not drop when the service slows down.
 * A late tick catches up on what it missed, so timer jitter does not lower the rate.
 */
export const constantRate =
	(ratePerSecond: number) =>
	(elapsedMs: number): number =>
		(ratePerSecond * elapsedMs) / 1000;
