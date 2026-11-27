/**
 * Benchmark suite for the Microsoft Graph endpoints of @rocket.chat/exchange
 *
 * Measures how fast the endpoints are built from the configured hosts (ops/sec), including hosts
 * padded with 100k slashes, which must stay as fast as the plain ones.
 * Run with: `yarn bench` from packages/exchange/
 */

import { Bench, type Task } from 'tinybench';

import { GraphTokenClient, type GraphTokenClientConfig } from '../src/graph/GraphTokenClient';
import { MicrosoftGraphProvider } from '../src/graph/MicrosoftGraphProvider';

// ── Fixtures ───────────────────────────────────────────────────────────────

const config: GraphTokenClientConfig = {
	tenantId: 'contoso.onmicrosoft.com',
	clientId: 'client-id',
	clientSecret: 'client-secret',
};

const slashes = '/'.repeat(100_000);

type Fixture = {
	name: string;
	config: GraphTokenClientConfig;
};

const fixtures: Fixture[] = [
	{ name: 'default hosts', config },
	{
		name: 'trailing slash',
		config: { ...config, authorityHost: 'https://login.microsoftonline.com/', graphHost: 'https://graph.microsoft.com/' },
	},
	{
		name: '100k slashes followed by another character',
		config: {
			...config,
			authorityHost: `https://login.microsoftonline.com${slashes}x`,
			graphHost: `https://graph.microsoft.com${slashes}x`,
		},
	},
];

const MAILBOX = 'user@contoso.com';
const timeWindow = { start: new Date('2026-08-21T00:00:00Z'), end: new Date('2026-08-22T00:00:00Z') };

const offline = new Error('offline');

/** Turns down every token request, so the benchmark never reaches the network. */
class OfflineTokenClient extends GraphTokenClient {
	public override async getAccessToken(): Promise<string> {
		throw offline;
	}
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatResults(tasks: Task[]) {
	return tasks.map(({ name, result }) => ({
		'Task': name,
		'ops/sec': Math.round(result?.throughput.mean ?? 0).toLocaleString(),
		'Avg (ms)': (result?.latency.mean ?? 0).toFixed(4),
		'Min (ms)': (result?.latency.min ?? 0).toFixed(4),
		'Max (ms)': (result?.latency.max ?? 0).toFixed(4),
		'P99 (ms)': (result?.latency.p99 ?? 0).toFixed(4),
		'Samples': result?.latency.samples.length ?? 0,
	}));
}

// ── Runner ─────────────────────────────────────────────────────────────────

async function run() {
	console.log('='.repeat(72));
	console.log('  @rocket.chat/exchange — Graph Endpoints Benchmark Suite');
	console.log('='.repeat(72));
	console.log();

	const tokenClientBench = new Bench({ time: 1000, warmupTime: 200, throws: true });

	for (const fixture of fixtures) {
		const client = new GraphTokenClient(fixture.config);

		tokenClientBench.add(fixture.name, () => [client.tokenEndpoint, client.scope]);
	}

	await tokenClientBench.run();

	console.log(`── GraphTokenClient: token endpoint and scope ${'─'.repeat(26)}`);
	console.table(formatResults(tokenClientBench.tasks));
	console.log();

	const providerBench = new Bench({ time: 1000, warmupTime: 200, throws: true });

	for (const fixture of fixtures) {
		const provider = new MicrosoftGraphProvider(fixture.config, new OfflineTokenClient(fixture.config));

		providerBench.add(fixture.name, async () => {
			await provider.listEvents(MAILBOX, timeWindow).catch((error: unknown) => {
				if (error !== offline) {
					throw error;
				}
			});
		});
	}

	await providerBench.run();

	console.log(`── MicrosoftGraphProvider: calendar view URL ${'─'.repeat(27)}`);
	console.table(formatResults(providerBench.tasks));
	console.log();

	console.log('='.repeat(72));
	console.log('  Done.');
	console.log('='.repeat(72));
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
