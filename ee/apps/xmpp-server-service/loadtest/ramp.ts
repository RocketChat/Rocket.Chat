import type { StepResult, Thresholds } from './report';
import { evaluateStep, printStep } from './report';
import { constantRate, startLoop } from './scheduler';
import type { Session } from './session';
import { backlogOf, drain, startSampler } from './session';
import { decodedOf, durationPercentileMs, failedOf, fetchStats, processedOf } from './stats';

export type RampOptions = {
	rateStart: number;
	rateStep: number;
	rateMax: number;
	stepSeconds: number;
	drainSeconds: number;
	/** Consecutive failing steps before the ramp stops. */
	stopAfterBehind: number;
	thresholds: Thresholds;
};

const SAMPLE_INTERVAL_MS = 1000;

/** Raises a constant send rate step by step, draining between steps, until the service stops keeping up. */
export async function runRamp(session: Session, options: RampOptions): Promise<StepResult[]> {
	const { scenario, keys, decodeOnly, serviceUrl } = session;
	const steps: StepResult[] = [];
	let failingInARow = 0;

	for (let rate = options.rateStart; rate <= options.rateMax && !session.shouldStop(); rate += Math.max(1, options.rateStep)) {
		const start = await fetchStats(serviceUrl);
		const startedAt = Date.now();
		const sentAtStepStart = session.sentTotal;

		const loop = startLoop({
			durationMs: options.stepSeconds * 1000,
			target: constantRate(rate),
			send: () => scenario.send(),
			onSendError: (error) => session.onSendError(error),
			shouldStop: () => session.shouldStop(),
		});
		const sampler = startSampler(session, SAMPLE_INTERVAL_MS, () => sentAtStepStart + loop.sent);

		const result = await loop.done;
		// Taken as soon as sending stops, so processed and sent rates cover the same window
		const end = await fetchStats(serviceUrl);
		const windowSeconds = (Date.now() - startedAt) / 1000;
		await sampler.stop();
		session.sentTotal += result.sent;

		const { drained, drainMs } = await drain(session, options.drainSeconds * 1000);

		const step = evaluateStep(
			{
				samples: sampler.samples,
				decodeOnly,
				targetRate: rate,
				achievedRate: result.sent / (result.elapsedMs / 1000),
				decodedRate: (decodedOf(end, keys) - decodedOf(start, keys)) / windowSeconds,
				processedRate: (processedOf(end, keys, decodeOnly) - processedOf(start, keys, decodeOnly)) / windowSeconds,
				backlogStart: backlogOf(session, start, sentAtStepStart),
				backlogEnd: backlogOf(session, end, session.sentTotal),
				failed: failedOf(end, keys) - failedOf(start, keys),
				sendErrors: result.sendErrors,
				handlerP50Ms: durationPercentileMs(start, end, keys, 0.5),
				handlerP99Ms: durationPercentileMs(start, end, keys, 0.99),
				generatorLagP99Ms: result.generatorLagP99Ms,
				rssMb: end.rssBytes / 1024 / 1024,
				statsTimeouts: sampler.timeouts,
				drainMs,
				drained,
				interrupted: session.shouldStop(),
				extras: scenario.takeStepExtras?.() ?? {},
			},
			options.thresholds,
		);
		steps.push(step);
		printStep(step, decodeOnly);

		failingInARow = step.problems.length ? failingInARow + 1 : 0;
		if (failingInARow >= Math.max(1, options.stopAfterBehind)) {
			break;
		}
		if (!drained) {
			console.log('stopping: the previous step never drained, so the next one would not start clean');
			break;
		}
	}

	return steps;
}
