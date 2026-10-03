import type { MaxResult, Sample } from './report';
import { evaluateMax, printMax } from './report';
import { startLoop } from './scheduler';
import type { Session } from './session';
import { drain, processedSinceBaseline, startSampler } from './session';
import type { InboundStats } from './stats';
import { durationPercentileMs, failedOf, fetchStats } from './stats';

export type MaxOptions = {
	durationSeconds: number;
	/** Excluded from the result while the queue grows to its working size. */
	settleSeconds: number;
	/** Work kept queued ahead of the service, in seconds of its recent throughput. */
	queueSeconds: number;
	minQueue: number;
	maxQueue: number;
	/** How often the generator learns how much the service has processed. */
	pollMs: number;
	drainSeconds: number;
};

const RATE_WINDOW_MS = 1000;
const PROGRESS_EVERY_MS = 5000;
// Below this share of the queue target on average, the generator, not the service, was the limit
const GENERATOR_BOUND_FILL = 0.5;

const rateOver = (from: Sample, to: Sample, value: (sample: Sample) => number): number =>
	to.t > from.t ? ((value(to) - value(from)) * 1000) / (to.t - from.t) : 0;

const median = (values: number[]): number => {
	const sorted = [...values].sort((a, b) => a - b);
	return sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
};

/**
 * Keeps the service saturated without flooding it: sends only enough to hold a queue
 * of `queueSeconds` worth of its recent throughput ahead of what it has processed. The
 * rate it then processes at is its maximum throughput for the scenario.
 */
export async function runMax(session: Session, options: MaxOptions): Promise<MaxResult> {
	const { scenario, keys, decodeOnly, serviceUrl } = session;
	const sentAtStart = session.sentTotal;
	const processedAtStart = processedSinceBaseline(session, await fetchStats(serviceUrl));

	const queueTargets: number[] = [];
	let queueTarget = options.minQueue;
	let steadyStart: { stats: InboundStats; sample: Sample } | undefined;
	let lastProgressAt = Date.now();

	// Declared before the loop so the loop's target can read the latest sample
	let sampler: ReturnType<typeof startSampler> | undefined;
	const loop = startLoop({
		durationMs: options.durationSeconds * 1000,
		target: () => {
			const latest = sampler?.samples.at(-1);
			return (latest ? latest.processed - processedAtStart : 0) + queueTarget;
		},
		send: () => scenario.send(),
		onSendError: (error) => session.onSendError(error),
		shouldStop: () => session.shouldStop(),
	});
	const startedAt = Date.now();

	sampler = startSampler(session, options.pollMs, () => sentAtStart + loop.sent);
	const { samples } = sampler;
	const retune = setInterval(() => {
		const latest = samples.at(-1);
		const windowStart = latest && samples.findLast((sample) => sample.t <= latest.t - RATE_WINDOW_MS);
		if (!latest || !windowStart) {
			return;
		}
		const recentRate = rateOver(windowStart, latest, (s) => s.processed);
		queueTarget = Math.min(options.maxQueue, Math.max(options.minQueue, recentRate * options.queueSeconds));

		const inSteadyState = latest.t - startedAt >= options.settleSeconds * 1000;
		if (inSteadyState) {
			queueTargets.push(queueTarget);
			if (!steadyStart && sampler?.latest) {
				steadyStart = { stats: sampler.latest, sample: latest };
			}
		}
		if (Date.now() - lastProgressAt >= PROGRESS_EVERY_MS) {
			lastProgressAt = Date.now();
			console.log(
				`${((latest.t - startedAt) / 1000).toFixed(0)} s: processed ${recentRate.toFixed(0)}/s, backlog ${latest.sent - latest.processed}, ` +
					`queue target ${queueTarget.toFixed(0)}, inflight ${latest.inflight}, loop ${latest.loopLagMs.toFixed(0)} ms${inSteadyState ? '' : ' (settling)'}`,
			);
		}
	}, options.pollMs);

	const result = await loop.done;
	const end = await fetchStats(serviceUrl);
	clearInterval(retune);
	await sampler.stop();
	session.sentTotal += result.sent;

	const { drained, drainMs } = await drain(session, options.drainSeconds * 1000);

	const steadyFrom = steadyStart?.sample.t;
	const steady = steadyFrom === undefined ? [] : samples.filter((sample) => sample.t >= steadyFrom);
	const first = steady[0];
	const last = steady.at(-1);
	const measuredSeconds = first && last ? (last.t - first.t) / 1000 : 0;
	const backlogMean = steady.length ? steady.reduce((sum, s) => sum + (s.sent - s.processed), 0) / steady.length : 0;
	const queueTargetMean = queueTargets.length ? queueTargets.reduce((sum, value) => sum + value, 0) / queueTargets.length : 0;

	const max = evaluateMax({
		measuredSeconds,
		sentRate: first && last ? rateOver(first, last, (s) => s.sent) : 0,
		decodedRate: first && last ? rateOver(first, last, (s) => s.decoded) : 0,
		processedRate: first && last ? rateOver(first, last, (s) => s.processed) : 0,
		queueTargetMean,
		backlogMean,
		inflightMax: Math.max(0, ...steady.map((s) => s.inflight)),
		failed: failedOf(end, keys) - failedOf(session.baseline, keys),
		sendErrors: result.sendErrors,
		handlerP50Ms: steadyStart && durationPercentileMs(steadyStart.stats, end, keys, 0.5),
		handlerP99Ms: steadyStart && durationPercentileMs(steadyStart.stats, end, keys, 0.99),
		// Each sample covers only one poll interval, so the median says more than the noisiest one
		serviceLoopLagP99Ms: median(steady.map((s) => s.loopLagMs)),
		generatorLagP99Ms: result.generatorLagP99Ms,
		rssMbMax: Math.max(0, ...samples.map((s) => s.rssMb)),
		statsTimeouts: sampler.timeouts,
		drainMs,
		drained,
		interrupted: session.shouldStop(),
		extras: scenario.takeStepExtras?.() ?? {},
		generatorBound: queueTargetMean > 0 && backlogMean < queueTargetMean * GENERATOR_BOUND_FILL,
	});
	printMax(max, scenario.name, decodeOnly);
	return max;
}
