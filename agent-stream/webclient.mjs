#!/usr/bin/env node
// The secondary metric of S1: main-thread time of the real web client for each delta. A headless Chromium opens the S1
// room as its viewer, then the producer streams one reply. The idle rate of the same page is subtracted.
// usage: node webclient.mjs --server http://localhost:3000 --seed seed.json --w 50 --out results/ [--run 1] [--sink update-message]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

import { chromium } from 'playwright';

import { REPLY } from './scenarios.mjs';

const { values: args } = parseArgs({
	options: {
		'server': { type: 'string', default: 'http://localhost:3000' },
		'seed': { type: 'string' },
		'w': { type: 'string', default: '0' },
		'out': { type: 'string' },
		'run': { type: 'string', default: '1' },
		'sink': { type: 'string', default: 'update-message' },
		'label': { type: 'string', default: 'h0' },
		'idle-ms': { type: 'string', default: '10000' },
	},
});
const seed = JSON.parse(readFileSync(args.seed, 'utf8'));
const user = seed.users[0];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const browser = await chromium.launch();
const context = await browser.newContext({
	storageState: {
		cookies: [],
		origins: [
			{
				origin: args.server,
				localStorage: [
					{ name: 'userLanguage', value: 'en-US' },
					{ name: 'Meteor.loginToken', value: user.token },
					{ name: 'Meteor.loginTokenExpires', value: new Date(Date.now() + 86_400_000).toISOString() },
					{ name: 'Meteor.userId', value: user.userId },
				],
			},
		],
	},
});
const page = await context.newPage();
await page.goto(`${args.server}/channel/as-s1`);
await page.waitForSelector('textarea[name="msg"]', { timeout: 120_000 });
await sleep(3000);

const cdp = await context.newCDPSession(page);
await cdp.send('Performance.enable');
const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map(({ name, value }) => [name, value]));
await page.evaluate(() => {
	window.__longTasks = [];
	new PerformanceObserver((list) => window.__longTasks.push(...list.getEntries().map((entry) => entry.duration))).observe({
		type: 'longtask',
	});
});

const KEYS = ['TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration'];
const delta = (after, before) => Object.fromEntries(KEYS.map((key) => [key, (after[key] - before[key]) * 1000]));

const idleMs = Number(args['idle-ms']);
const idle0 = await metrics();
await sleep(idleMs);
const idle = delta(await metrics(), idle0);

await fetch(`${args.server}/_agent-stream/metrics?reset=1`);
const s0 = await metrics();
const t0 = Date.now();
const startRes = await fetch(`${args.server}/_agent-stream/start`, {
	method: 'POST',
	headers: { 'content-type': 'application/json' },
	body: JSON.stringify({
		rooms: [seed.rooms.s1],
		userId: seed.bot.userId,
		w: Number(args.w),
		tokens: REPLY.tokens,
		tps: REPLY.tokensPerSecond,
		sink: args.sink,
	}),
});
const {
	streams: [{ mid }],
} = await startRes.json();
for (;;) {
	await sleep(500);
	const status = await (await fetch(`${args.server}/_agent-stream/status`)).json();
	if (status.active === 0 && status.queued === 0) {
		break;
	}
}
await sleep(2000);
const streamMs = Date.now() - t0;
const stream = delta(await metrics(), s0);
const { producer } = await (await fetch(`${args.server}/_agent-stream/metrics`)).json();
// the client shows the persisted message after the end: every task title and the last output line must be on screen
const { message } = await (
	await fetch(`${args.server}/api/v1/chat.getMessage?msgId=${mid}`, { headers: { 'X-User-Id': user.userId, 'X-Auth-Token': user.token } })
).json();
const shown = await page.locator(`[data-mid="${mid}"]`).first().innerText();
const plan = message.blocks.find((block) => block.type === 'plan');
const output = message.blocks.find((block) => block.type === 'section')?.text.text ?? '';
const blocksShown = {
	tasksMissing: plan.tasks.filter((task) => !shown.includes(task.title)).length,
	outputTailShown: shown.includes(output.trim().slice(-20)),
	state: message.streaming?.state,
};
const longTasks = await page.evaluate(() => window.__longTasks);
await browser.close();

const deltas = producer.deltas + 1;
const net = Object.fromEntries(KEYS.map((key) => [key, stream[key] - (idle[key] / idleMs) * streamMs]));
const result = {
	label: args.label,
	sink: args.sink,
	scenario: 'S1-webclient',
	w: Number(args.w),
	run: Number(args.run),
	streamMs,
	deltas,
	blocksShown,
	idlePerSecondMs: Object.fromEntries(KEYS.map((key) => [key, (idle[key] / idleMs) * 1000])),
	rawMs: stream,
	netMs: net,
	netMsPerDelta: Object.fromEntries(KEYS.map((key) => [key, net[key] / deltas])),
	longTasks: { count: longTasks.length, totalMs: longTasks.reduce((a, b) => a + b, 0), maxMs: Math.max(0, ...longTasks) },
};
mkdirSync(args.out, { recursive: true });
writeFileSync(join(args.out, `${args.label}-webclient-S1-w${args.w}-r${args.run}.json`), JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
