import fs from 'node:fs';

/** One `/stats` reading; `sent`, `decoded` and `processed` count from the start of load. */
export type Sample = { t: number; sent: number; decoded: number; processed: number; inflight: number; loopLagMs: number; rssMb: number };

export type Thresholds = {
	/** Minimum share of the achieved send rate the service must process. */
	minProcessedRatio: number;
	latencyP99Ms: number;
	loopLagP99Ms: number;
	/** The generator missing the target by more than this share means the step measured the generator. */
	generatorShortfall: number;
	generatorLagP99Ms: number;
};

export const DEFAULT_THRESHOLDS: Thresholds = {
	minProcessedRatio: 0.95,
	latencyP99Ms: 1000,
	loopLagP99Ms: 100,
	generatorShortfall: 0.05,
	generatorLagP99Ms: 50,
};

export type StepResult = {
	targetRate: number;
	achievedRate: number;
	decodedRate: number;
	processedRate: number;
	/** Sent but not yet processed, at the start and end of the step. */
	backlogStart: number;
	backlogEnd: number;
	/** Least-squares growth of the backlog across the step, in events per second. */
	backlogSlope: number;
	inflightMax: number;
	failed: number;
	sendErrors: number;
	handlerP50Ms?: number;
	handlerP99Ms?: number;
	serviceLoopLagP99Ms: number;
	generatorLagP99Ms: number;
	rssMb: number;
	statsTimeouts: number;
	drainMs: number;
	drained: boolean;
	/** Cut short by Ctrl-C; too short to count as evidence the service keeps up. */
	interrupted: boolean;
	extras: Record<string, number | undefined>;
	generatorBound: boolean;
	/** Why the step does not count as kept up; empty when it does. */
	problems: string[];
};

const slopeOf = (samples: Sample[], value: (sample: Sample) => number): number => {
	if (samples.length < 2) {
		return 0;
	}
	const meanT = samples.reduce((sum, s) => sum + s.t, 0) / samples.length;
	const meanV = samples.reduce((sum, s) => sum + value(s), 0) / samples.length;
	let numerator = 0;
	let denominator = 0;
	for (const s of samples) {
		numerator += (s.t - meanT) * (value(s) - meanV);
		denominator += (s.t - meanT) ** 2;
	}
	return denominator === 0 ? 0 : (numerator / denominator) * 1000;
};

export type StepInput = Omit<StepResult, 'backlogSlope' | 'inflightMax' | 'serviceLoopLagP99Ms' | 'generatorBound' | 'problems'> & {
	samples: Sample[];
	decodeOnly: boolean;
};

/** Handlers that failed or sends that errored did no real work, so processed counts would overstate throughput. */
const lostWorkProblems = ({ failed, sendErrors, statsTimeouts }: { failed: number; sendErrors: number; statsTimeouts: number }) => [
	...(failed > 0 ? [`${failed} handlers failed`] : []),
	...(sendErrors > 0 ? [`${sendErrors} sends failed`] : []),
	...(statsTimeouts > 0 ? [`${statsTimeouts} /stats timeouts`] : []),
];

/** Decides whether the service kept up with the step, and why not when it did not. */
export function evaluateStep({ samples, decodeOnly, ...step }: StepInput, thresholds: Thresholds): StepResult {
	const backlogSlope = slopeOf(samples, (s) => s.sent - s.processed);
	const serviceLoopLagP99Ms = Math.max(0, ...samples.map((s) => s.loopLagMs));
	const problems: string[] = [];

	if (step.processedRate < step.achievedRate * thresholds.minProcessedRatio) {
		problems.push(`processed ${step.processedRate.toFixed(0)}/s of ${step.achievedRate.toFixed(0)}/s sent`);
	}
	// Growth under a second's worth of traffic is sampling noise
	if (backlogSlope > step.achievedRate * (1 - thresholds.minProcessedRatio) && step.backlogEnd > step.targetRate) {
		problems.push(`backlog growing ${backlogSlope.toFixed(0)}/s`);
	}
	if (!decodeOnly && step.handlerP99Ms !== undefined && step.handlerP99Ms > thresholds.latencyP99Ms) {
		problems.push(`handler p99 ${step.handlerP99Ms} ms`);
	}
	if (serviceLoopLagP99Ms > thresholds.loopLagP99Ms) {
		problems.push(`service event loop lag p99 ${serviceLoopLagP99Ms.toFixed(0)} ms`);
	}
	if (!step.drained) {
		problems.push('backlog did not drain');
	}
	problems.push(...lostWorkProblems(step));

	return {
		...step,
		backlogSlope,
		inflightMax: Math.max(0, ...samples.map((s) => s.inflight)),
		serviceLoopLagP99Ms,
		generatorBound:
			step.achievedRate < step.targetRate * (1 - thresholds.generatorShortfall) || step.generatorLagP99Ms > thresholds.generatorLagP99Ms,
		problems,
	};
}

const round = (value: number | undefined): number | string => (value === undefined ? '-' : Math.round(value));

/** Decode-only runs have no handlers, so processing, in-flight and latency columns would only repeat or be empty. */
export function printStep(step: StepResult, decodeOnly: boolean): void {
	const verdict = step.problems.length ? `NOT OK: ${step.problems.join('; ')}` : 'ok';
	const handlerColumns = decodeOnly
		? []
		: [
				`processed ${round(step.processedRate)}/s`,
				`inflight max ${step.inflightMax}`,
				// No handler settled during the step, which is itself a sign of a stalled service
				step.handlerP99Ms === undefined ? 'p99 none settled' : `p99 ≤${round(step.handlerP99Ms)} ms`,
			];
	console.log(
		[
			decodeOnly ? '[decode-only]' : '',
			step.interrupted ? '[interrupted]' : '',
			`rate ${step.targetRate}/s`,
			`sent ${round(step.achievedRate)}/s`,
			`decoded ${round(step.decodedRate)}/s`,
			...handlerColumns,
			`backlog ${step.backlogStart}→${step.backlogEnd}`,
			`loop ${round(step.serviceLoopLagP99Ms)} ms`,
			`rss ${round(step.rssMb)} MB`,
			`drain ${round(step.drainMs)} ms`,
			...Object.entries(step.extras).map(([key, value]) => `${key} ${round(value)}`),
			step.generatorBound ? '[generator-bound]' : '',
			`→ ${verdict}`,
		]
			.filter(Boolean)
			.join(' | '),
	);
}

export type MaxResult = {
	/** Seconds measured after the settle period; the rates below cover only this window. */
	measuredSeconds: number;
	sentRate: number;
	decodedRate: number;
	/** The service's maximum throughput: events it finished handling per second while never idle. */
	processedRate: number;
	queueTargetMean: number;
	backlogMean: number;
	inflightMax: number;
	failed: number;
	sendErrors: number;
	handlerP50Ms?: number;
	handlerP99Ms?: number;
	serviceLoopLagP99Ms: number;
	generatorLagP99Ms: number;
	rssMbMax: number;
	statsTimeouts: number;
	drainMs: number;
	drained: boolean;
	interrupted: boolean;
	extras: Record<string, number | undefined>;
	/** The generator could not keep the queue full, so the service was sometimes idle and the rate is a floor. */
	generatorBound: boolean;
	/** Why the throughput figure is not trustworthy; empty when it is. */
	problems: string[];
};

export type MaxInput = Omit<MaxResult, 'problems'>;

export function evaluateMax(input: MaxInput): MaxResult {
	const problems = lostWorkProblems(input);
	if (!input.drained) {
		problems.push('backlog did not drain');
	}
	if (input.generatorBound) {
		problems.push('generator-bound: the service was sometimes idle, so this is a floor');
	}
	if (input.measuredSeconds < 5) {
		problems.push(`only ${input.measuredSeconds.toFixed(1)} s measured`);
	}
	return { ...input, problems };
}

export function printMax(result: MaxResult, scenario: string, decodeOnly: boolean): void {
	const handlerColumns = decodeOnly
		? []
		: [`inflight max ${result.inflightMax}`, `handler p50 ≤${round(result.handlerP50Ms)} ms p99 ≤${round(result.handlerP99Ms)} ms`];
	console.log(
		[
			`max throughput (${scenario}${decodeOnly ? ', decode-only' : ''}): ${round(result.processedRate)} events/s`,
			`over ${result.measuredSeconds.toFixed(1)} s`,
			`sent ${round(result.sentRate)}/s`,
			`decoded ${round(result.decodedRate)}/s`,
			`queue ~${round(result.queueTargetMean)} (backlog mean ${round(result.backlogMean)})`,
			...handlerColumns,
			`loop ${round(result.serviceLoopLagP99Ms)} ms`,
			`rss max ${round(result.rssMbMax)} MB`,
			...Object.entries(result.extras).map(([key, value]) => `${key} ${round(value)}`),
		].join(' | '),
	);
	console.log(result.problems.length ? `NOT TRUSTWORTHY: ${result.problems.join('; ')}` : 'result ok');
}

/** Every send should be decoded exactly once and then handled exactly once. */
export type Totals = { sent: number; decoded: number; processed: number; failed: number };

export function totalsProblems({ sent, decoded, processed, failed }: Totals, decodeOnly: boolean): string[] {
	const problems: string[] = [];
	if (decoded !== sent) {
		problems.push(`${sent - decoded} of ${sent} sends were ${decoded < sent ? 'never decoded' : 'decoded more than once'}`);
	}
	if (!decodeOnly && processed !== decoded) {
		problems.push(`${decoded - processed} decoded events never finished handling`);
	}
	if (failed > 0) {
		problems.push(`${failed} handlers failed`);
	}
	return problems;
}

export type Completeness = { expected: number; persisted: number; duplicates: number; missing: number };

export type Report = {
	runId: string;
	mode: 'ramp' | 'max';
	scenario: string;
	decodeOnly: boolean;
	options: Record<string, unknown>;
	steps?: StepResult[];
	/** Highest ramp step the service kept up with, ignoring generator-bound and interrupted steps. */
	maxSustainedRate?: number;
	max?: MaxResult;
	totals: Totals;
	completeness?: Completeness;
	problems: string[];
};

export function maxSustainedRateOf(steps: StepResult[]): number | undefined {
	let maxSustainedRate: number | undefined;
	for (const step of steps) {
		if (step.problems.length) {
			break;
		}
		if (!step.generatorBound && !step.interrupted) {
			maxSustainedRate = step.targetRate;
		}
	}
	return maxSustainedRate;
}

export function writeReport(path: string, report: Report): void {
	fs.writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
}
