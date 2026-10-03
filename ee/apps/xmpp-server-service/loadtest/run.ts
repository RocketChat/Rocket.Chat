import crypto from 'node:crypto';
import { parseArgs } from 'node:util';

import { checkCompleteness } from './completeness';
import { runMax } from './max';
import { dnsOverridesFor, startPeers, stopPeers } from './peers';
import { runRamp } from './ramp';
import type { Report, Totals } from './report';
import { DEFAULT_THRESHOLDS, maxSustainedRateOf, totalsProblems, writeReport } from './report';
import { dmScenario } from './scenarios/dm';
import { mixScenario } from './scenarios/mix';
import { mucScenario } from './scenarios/muc';
import { presenceScenario } from './scenarios/presence';
import type { Scenario, ScenarioContext } from './scenarios/types';
import { ensureHostedRoom, ensureLocalUsers, ensureXMPPEnabled, createRestClient } from './seed';
import { createSession, pollUntil } from './session';
import type { InboundStats } from './stats';
import { decodedOf, failedOf, fetchStats, processedOf } from './stats';

const USAGE = `Usage:
  yarn loadtest overrides [--domains N] [--base-port P]
      Prints the XMPP_DNS_OVERRIDES value to start the service with.

  yarn loadtest run --scenario dm|presence|muc|mix [--mode ramp|max] [options]
      --mix dm=2,muc=1,presence=1   weights for the mix scenario
      --domains 4                   fake remote domains (one S2S socket each)
      --users 25                    remote users per domain (dm, presence)
      --locals 20                   local recipient users
      --occupants 10                remote occupants in the hosted room (muc)
      --room lt-muc                 hosted room name (muc)
      --drain-seconds 60            how long the backlog may take to drain before it counts against the run

    --mode ramp (default): constant rates, stepped up until the service stops keeping up
      --rate-start 50 --rate-step 50 --rate-max 5000 --step-seconds 30
      --stop-after-behind 1         consecutive failing steps before the ramp stops
      --latency-p99-ms 1000 --loop-lag-p99-ms 100

    --mode max: keeps the service saturated and reports its maximum throughput
      --duration-seconds 60 --settle-seconds 5
      --queue-seconds 0.5           work kept queued ahead of the service, in seconds of its throughput
      --min-queue 200 --max-queue 50000 --poll-ms 100

      --cold                        skip warm-up and measure first-contact cost too
      --configure <domain>          enable the XMPP server with this domain first
      --service-url http://localhost:3039   --rc-url http://localhost:3000
      --rc-host 127.0.0.1 --rc-port <XMPP_Server_Port>   --base-port 15269
      --mongo-url mongodb://localhost:3001/meteor   --out loadtest-<runId>.json

  Credentials: RC_USER + RC_PASSWORD, or RC_USER_ID + RC_AUTH_TOKEN (admin).
  Ctrl-C ends the current measurement early and still writes the report; press it twice to exit at once.`;

const { values: args, positionals } = parseArgs({
	allowPositionals: true,
	options: {
		'scenario': { type: 'string', default: 'dm' },
		'mode': { type: 'string', default: 'ramp' },
		'mix': { type: 'string', default: 'dm=1,muc=1,presence=1' },
		'domains': { type: 'string', default: '4' },
		'users': { type: 'string', default: '25' },
		'locals': { type: 'string', default: '20' },
		'occupants': { type: 'string', default: '10' },
		'room': { type: 'string', default: 'lt-muc' },
		'rate-start': { type: 'string', default: '50' },
		'rate-step': { type: 'string', default: '50' },
		'rate-max': { type: 'string', default: '5000' },
		'step-seconds': { type: 'string', default: '30' },
		'drain-seconds': { type: 'string', default: '60' },
		'stop-after-behind': { type: 'string', default: '1' },
		'latency-p99-ms': { type: 'string', default: String(DEFAULT_THRESHOLDS.latencyP99Ms) },
		'loop-lag-p99-ms': { type: 'string', default: String(DEFAULT_THRESHOLDS.loopLagP99Ms) },
		'duration-seconds': { type: 'string', default: '60' },
		'settle-seconds': { type: 'string', default: '5' },
		'queue-seconds': { type: 'string', default: '0.5' },
		'min-queue': { type: 'string', default: '200' },
		'max-queue': { type: 'string', default: '50000' },
		'poll-ms': { type: 'string', default: '100' },
		'cold': { type: 'boolean', default: false },
		'configure': { type: 'string' },
		'service-url': { type: 'string', default: 'http://localhost:3039' },
		'rc-url': { type: 'string', default: 'http://localhost:3000' },
		'rc-host': { type: 'string', default: '127.0.0.1' },
		'rc-port': { type: 'string' },
		'base-port': { type: 'string', default: '15269' },
		'mongo-url': { type: 'string', default: process.env.MONGO_URL || 'mongodb://localhost:3001/meteor' },
		'out': { type: 'string' },
		'help': { type: 'boolean', default: false },
	},
});

const int = (name: keyof typeof args): number => {
	const value = Number(args[name]);
	if (!Number.isFinite(value) || value < 0) {
		throw new Error(`--${name} must be a non-negative number`);
	}
	return value;
};

const IDLE_TIMEOUT_MS = 120_000;

let stopRequested = false;
process.on('SIGINT', () => {
	if (stopRequested) {
		process.exit(130);
	}
	stopRequested = true;
	console.log('\nstopping: finishing the current measurement and writing the report (Ctrl-C again to exit now)');
});

async function run(): Promise<void> {
	if (args.mode !== 'ramp' && args.mode !== 'max') {
		throw new Error(`--mode must be ramp or max, not "${args.mode}"`);
	}
	const { mode } = args;
	const runId = crypto.randomBytes(4).toString('hex');
	const serviceUrl = args['service-url'];
	const domains = Math.max(1, int('domains'));
	const basePort = int('base-port');
	const thresholds = { ...DEFAULT_THRESHOLDS, latencyP99Ms: int('latency-p99-ms'), loopLagP99Ms: int('loop-lag-p99-ms') };

	const rest = await createRestClient(args['rc-url']);
	const setup = await ensureXMPPEnabled(
		rest,
		args.configure ? { domain: args.configure, port: args['rc-port'] ? int('rc-port') : 5269 } : undefined,
	);
	const rcPort = args['rc-port'] ? int('rc-port') : setup.port;
	if (setup.allowList.length && !setup.allowList.some((entry) => entry.endsWith('.test'))) {
		console.warn(`XMPP_Server_Domain_Allow_List (${setup.allowList.join(', ')}) may reject the lt*.test peers`);
	}

	const { decodeOnly } = await fetchStats(serviceUrl).catch((error) => {
		throw new Error(`The service is not reachable at ${serviceUrl}: ${(error as Error).message}`);
	});

	const scenarioNames =
		args.scenario === 'mix'
			? args.mix.split(',').map((entry) => {
					const [name, weight] = entry.split('=');
					return { name, weight: Number(weight ?? 1) };
				})
			: [{ name: args.scenario, weight: 1 }];
	if (!setup.presenceEnabled && scenarioNames.some(({ name }) => name === 'presence')) {
		throw new Error('XMPP_Server_Presence_Enabled is off, so the service would drop every presence without doing any work');
	}

	const localUsers = await ensureLocalUsers(rest, Math.max(1, int('locals')));
	const roomJid = scenarioNames.some(({ name }) => name === 'muc')
		? await ensureHostedRoom(rest, args.room, localUsers.slice(0, 5))
		: undefined;

	console.log(
		`run ${runId}: service ${setup.domain} at ${args['rc-host']}:${rcPort}, ${domains} peer domain(s), decode-only ${decodeOnly}`,
	);
	console.log(`the service must run with XMPP_DNS_OVERRIDES covering at least: ${dnsOverridesFor(domains, basePort)}`);

	const peers = await startPeers({
		count: domains,
		basePort,
		rcDomain: setup.domain,
		rcMucDomain: setup.mucDomain,
		rcAddress: { host: args['rc-host'], port: rcPort },
	});

	let seq = 0;
	let warmSeq = 0;

	const waitUntil = async (label: string, done: (stats: InboundStats) => boolean): Promise<void> => {
		if (!(await pollUntil(IDLE_TIMEOUT_MS, async () => done(await fetchStats(serviceUrl))))) {
			throw new Error(`Timed out waiting for ${label}`);
		}
	};

	const ctx: ScenarioContext = {
		peers,
		rcDomain: setup.domain,
		localUsers,
		remoteUsersPerDomain: Math.max(1, int('users')),
		occupants: Math.max(1, int('occupants')),
		roomJid,
		nextId: () => `lt-${runId}-${seq++}`,
		warmupId: () => `lt-${runId}-warm-${warmSeq++}`,
		async expectHandled(events, count, action) {
			const before = processedOf(await fetchStats(serviceUrl), events, decodeOnly);
			await action();
			await waitUntil(`${count} ${events.join('/')} to be handled`, (stats) => processedOf(stats, events, decodeOnly) - before >= count);
		},
		waitForIdle: () => waitUntil('the service to go idle', (stats) => Object.values(stats.inflight).every((value) => value === 0)),
	};

	const build = (name: string): Scenario => {
		switch (name) {
			case 'dm':
				return dmScenario(ctx);
			case 'presence':
				return presenceScenario(ctx);
			case 'muc':
				return mucScenario(ctx);
			default:
				throw new Error(`Unknown scenario "${name}"`);
		}
	};
	const scenario =
		scenarioNames.length === 1
			? build(scenarioNames[0].name)
			: mixScenario(scenarioNames.map(({ name, weight }) => ({ scenario: build(name), weight })));
	const report: Report = {
		runId,
		mode,
		scenario: scenario.name,
		decodeOnly,
		options: args,
		totals: { sent: 0, decoded: 0, processed: 0, failed: 0 },
		problems: [],
	};

	try {
		if (!args.cold) {
			console.log('warming up…');
			await scenario.warmup();
		}
		scenario.takeStepExtras?.();

		const session = createSession({
			serviceUrl,
			scenario,
			keys: scenario.eventKeys,
			decodeOnly,
			baseline: await fetchStats(serviceUrl),
			shouldStop: () => stopRequested,
		});

		if (mode === 'ramp') {
			report.steps = await runRamp(session, {
				rateStart: int('rate-start'),
				rateStep: int('rate-step'),
				rateMax: int('rate-max'),
				stepSeconds: int('step-seconds'),
				drainSeconds: int('drain-seconds'),
				stopAfterBehind: int('stop-after-behind'),
				thresholds,
			});
			report.maxSustainedRate = maxSustainedRateOf(report.steps);
		} else {
			report.max = await runMax(session, {
				durationSeconds: int('duration-seconds'),
				settleSeconds: int('settle-seconds'),
				queueSeconds: int('queue-seconds'),
				minQueue: Math.max(1, int('min-queue')),
				maxQueue: Math.max(1, int('max-queue')),
				pollMs: Math.max(10, int('poll-ms')),
				drainSeconds: int('drain-seconds'),
			});
		}

		report.totals = totalsOf(session.keys, decodeOnly, session.baseline, await fetchStats(serviceUrl), session.sentTotal);
		report.problems.push(...totalsProblems(report.totals, decodeOnly));
		console.log(
			`accounting: sent ${report.totals.sent}, decoded ${report.totals.decoded}, processed ${report.totals.processed}, failed ${report.totals.failed}`,
		);

		if (!decodeOnly && scenario.persistedSends > 0) {
			const completeness = await checkCompleteness(args['mongo-url'], runId, scenario.persistedSends);
			report.completeness = completeness;
			console.log(
				`database: persisted ${completeness.persisted}/${completeness.expected}, missing ${completeness.missing}, duplicates ${completeness.duplicates}`,
			);
			if (completeness.missing !== 0) {
				report.problems.push(`${completeness.missing} messages missing from the database`);
			}
			if (completeness.duplicates > 0) {
				report.problems.push(`${completeness.duplicates} duplicate messages in the database`);
			}
		}
	} finally {
		await scenario.teardown?.();
		await stopPeers(peers);
	}

	const out = args.out ?? `loadtest-${runId}.json`;
	writeReport(out, report);
	if (mode === 'ramp') {
		console.log(
			report.maxSustainedRate === undefined
				? 'the service did not keep up with any complete step'
				: `max sustained rate: ${report.maxSustainedRate}/s (${scenario.name})`,
		);
	}
	console.log(
		report.problems.length ? `RUN PROBLEMS: ${report.problems.join('; ')}` : 'accounting ok: every send was decoded and handled once',
	);
	console.log(`report written to ${out}`);
}

function totalsOf(keys: string[], decodeOnly: boolean, baseline: InboundStats, end: InboundStats, sent: number): Totals {
	return {
		sent,
		decoded: decodedOf(end, keys) - decodedOf(baseline, keys),
		processed: processedOf(end, keys, decodeOnly) - processedOf(baseline, keys, decodeOnly),
		failed: failedOf(end, keys) - failedOf(baseline, keys),
	};
}

async function main(): Promise<void> {
	const command = positionals[0] ?? 'run';
	if (args.help) {
		console.log(USAGE);
		return;
	}
	if (command === 'overrides') {
		console.log(dnsOverridesFor(Math.max(1, int('domains')), int('base-port')));
		return;
	}
	if (command !== 'run') {
		console.error(USAGE);
		process.exitCode = 1;
		return;
	}
	await run();
}

main().then(
	() => process.exit(),
	(error) => {
		console.error(error);
		process.exit(1);
	},
);
