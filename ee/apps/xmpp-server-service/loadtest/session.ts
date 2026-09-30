import { setTimeout as sleep } from 'node:timers/promises';

import type { Sample } from './report';
import type { Scenario } from './scenarios/types';
import type { InboundStats } from './stats';
import { decodedOf, fetchStats, inflightOf, processedOf } from './stats';

const MAX_LOGGED_SEND_ERRORS = 10;

/** State shared by every measurement of one run; counts are relative to `baseline`, taken when load starts. */
export type Session = {
	serviceUrl: string;
	scenario: Scenario;
	/** The `/stats` events the scenario's sends turn into. */
	keys: string[];
	decodeOnly: boolean;
	baseline: InboundStats;
	/** Sends fired since load started, across every step. */
	sentTotal: number;
	shouldStop(): boolean;
	onSendError(error: unknown): void;
};

export function createSession(fields: Omit<Session, 'sentTotal' | 'onSendError'>): Session {
	let logged = 0;
	return {
		...fields,
		sentTotal: 0,
		onSendError(error) {
			if (logged++ < MAX_LOGGED_SEND_ERRORS) {
				console.error('send failed:', (error as Error).message);
			}
		},
	};
}

export const processedSinceBaseline = (session: Session, stats: InboundStats): number =>
	processedOf(stats, session.keys, session.decodeOnly) - processedOf(session.baseline, session.keys, session.decodeOnly);

/** Sent but not yet processed; includes stanzas still in socket buffers as well as handlers in flight. */
export const backlogOf = (session: Session, stats: InboundStats, sent: number): number => sent - processedSinceBaseline(session, stats);

/** Polls `check` until it holds; false when `timeoutMs` passes first. A failing check counts as not yet. */
export async function pollUntil(timeoutMs: number, check: () => Promise<boolean>, intervalMs = 250): Promise<boolean> {
	const deadline = Date.now() + timeoutMs;
	while (!(await check().catch(() => false))) {
		if (Date.now() > deadline) {
			return false;
		}
		await sleep(intervalMs);
	}
	return true;
}

/** Waits for the service to process everything sent so far. */
export async function drain(session: Session, timeoutMs: number): Promise<{ drained: boolean; drainMs: number }> {
	const startedAt = Date.now();
	const drained = await pollUntil(timeoutMs, async () => backlogOf(session, await fetchStats(session.serviceUrl), session.sentTotal) <= 0);
	return { drained, drainMs: Date.now() - startedAt };
}

export type Sampler = {
	readonly samples: Sample[];
	readonly timeouts: number;
	/** The most recent full snapshot, if any sample has succeeded yet. */
	readonly latest: InboundStats | undefined;
	stop(): Promise<void>;
};

/** Samples `/stats` every `intervalMs`; `sentNow` is the running send total at sampling time. */
export function startSampler(session: Session, intervalMs: number, sentNow: () => number): Sampler {
	const samples: Sample[] = [];
	const state = { timeouts: 0, running: true, latest: undefined as InboundStats | undefined };

	const done = (async () => {
		while (state.running) {
			await sleep(intervalMs);
			const sent = sentNow();
			try {
				const stats = await fetchStats(session.serviceUrl);
				state.latest = stats;
				samples.push({
					t: Date.now(),
					sent,
					decoded: decodedOf(stats, session.keys) - decodedOf(session.baseline, session.keys),
					processed: processedSinceBaseline(session, stats),
					inflight: inflightOf(stats, session.keys),
					loopLagMs: stats.eventLoopLagP99Ms,
					rssMb: stats.rssBytes / 1024 / 1024,
				});
			} catch {
				state.timeouts++;
			}
		}
	})();

	return {
		samples,
		get timeouts() {
			return state.timeouts;
		},
		get latest() {
			return state.latest;
		},
		async stop() {
			state.running = false;
			await done;
		},
	};
}
