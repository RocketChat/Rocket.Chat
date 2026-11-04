#!/usr/bin/env node
// Runs one failure mode of the report template against a running deployment and prints what the viewer saw and what
// was persisted. One viewer of the S1 room, on the last server; the producer on the first.
// usage: node failures.mjs --case stop|kill|restart|crash --servers A[,B] --seed seed.json
//          [--adapter ddp-room-messages] [--sink update-message] [--after 5000]
//          [--cmd "<shell command>"]   restart: restarts the viewer's instance; crash: kills the producer's instance
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';

import { adapters } from './adapters/index.mjs';
import { Viewer } from './lib/viewer.mjs';
import { REPLY } from './scenarios.mjs';

const { values: args } = parseArgs({
	options: {
		case: { type: 'string' },
		servers: { type: 'string', default: 'http://localhost:3000' },
		seed: { type: 'string' },
		adapter: { type: 'string', default: 'ddp-room-messages' },
		sink: { type: 'string', default: 'update-message' },
		after: { type: 'string', default: '5000' },
		cmd: { type: 'string' },
		w: { type: 'string', default: '50' },
	},
});

const servers = args.servers.split(',');
const seed = JSON.parse(readFileSync(args.seed, 'utf8'));
const user = seed.users[0];
const viewerServer = servers[servers.length - 1];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const post = (server, path, body) =>
	fetch(`${server}/_agent-stream/${path}`, {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	}).then((res) => res.json());
const persistedMessage = async (mid) => {
	for (const server of [...servers].reverse()) {
		try {
			const res = await fetch(`${server}/api/v1/chat.getMessage?msgId=${mid}`, {
				headers: { 'X-User-Id': user.userId, 'X-Auth-Token': user.token },
			});
			const { message } = await res.json();
			return { text: message.msg, streaming: message.streaming };
		} catch {
			// that instance is down; try the other one
		}
	}
	return undefined;
};
const waitFor = async (predicate, ms) => {
	const until = Date.now() + ms;
	while (!predicate() && Date.now() < until) {
		await sleep(200);
	}
	return predicate();
};

const viewer = new Viewer(
	{ index: 0, rid: seed.rooms.s1, userId: user.userId, token: user.token, baseUrl: viewerServer },
	adapters[args.adapter],
);
await viewer.start();
viewer.startRecording();

const {
	streams: [stream],
} = await post(servers[0], 'start', {
	rooms: [seed.rooms.s1],
	userId: seed.bot.userId,
	w: Number(args.w),
	tokens: REPLY.tokens,
	tps: REPLY.tokensPerSecond,
	sink: args.sink,
});
await sleep(Number(args.after));

const notes = [];
switch (args.case) {
	case 'stop':
		await post(servers[0], 'stop', { streamId: stream.streamId });
		break;
	case 'kill':
		await post(servers[0], 'kill', { streamId: stream.streamId });
		break;
	case 'crash':
		execSync(args.cmd, { stdio: 'inherit' });
		break;
	case 'restart': {
		const textBefore = viewer.text.length;
		execSync(args.cmd, { stdio: 'inherit' });
		notes.push(`viewer had ${textBefore} chars when its instance went down`);
		let attempts = 0;
		while (!(await viewer.reconnect().then(() => !viewer.lastError))) {
			attempts++;
			viewer.lastError = undefined;
			await sleep(1000);
		}
		notes.push(`reconnected after ${attempts} failed attempts, resumed at seq ${viewer.lastSeq} with ${viewer.text.length} chars`);
		break;
	}
	default:
		throw new Error(`unknown case ${args.case}`);
}

const ended = await waitFor(() => viewer.ended, ['kill', 'crash'].includes(args.case) ? 10_000 : 60_000);
const persisted = await persistedMessage(stream.mid);
viewer.close();

console.log(
	JSON.stringify(
		{
			case: args.case,
			viewerEnded: ended,
			viewerEndReason: viewer.endReason,
			viewerChars: viewer.text.length,
			persistedChars: persisted?.text.length,
			persistedStreaming: persisted?.streaming,
			viewerTextEqualsPersisted: viewer.text === persisted?.text,
			viewerTail: viewer.text.slice(-40),
			persistedTail: persisted?.text.slice(-40),
			stats: viewer.result(),
			notes,
		},
		(key, value) => (key === 'text' ? undefined : value),
		2,
	),
);
process.exit(0);
