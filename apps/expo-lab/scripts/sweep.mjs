#!/usr/bin/env node
// Runs the component sweep and writes a markdown table of what each Fuselage component did when mounted.
// It starts Metro with the sweep as the first screen plus a local receiver for the app's report; the dev client
// must be installed on a booted simulator or emulator (`yarn ios` / `yarn android` once). Usage:
//   yarn sweep [--out sweep-results.md] [--port 8099] [--metro-port 8081] [--platform ios|android] [--open]
import { spawn, spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
	options: {
		out: { type: 'string', default: 'sweep-results.md' },
		port: { type: 'string', default: '8099' },
		'metro-port': { type: 'string', default: '8081' },
		platform: { type: 'string', default: 'ios' },
		open: { type: 'boolean', default: false },
	},
});

const metroPort = Number(values['metro-port']);
// The Android emulator reaches the host through 10.0.2.2
const host = values.platform === 'android' ? '10.0.2.2' : 'localhost';
const sink = `http://${host}:${values.port}`;

const cell = (text) =>
	String(text ?? '')
		.replace(/\|/g, '\\|')
		.replace(/\s+/g, ' ');

const toMarkdown = (results) => {
	const counts = {};
	for (const { status } of results) counts[status] = (counts[status] ?? 0) + 1;
	const summary = Object.entries(counts)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([status, n]) => `${status}: ${n}`)
		.join(', ');
	const rows = results.map(({ name, status, size, error, uncaught, context, viaText }) => {
		const detail = [error, uncaught && `uncaught: ${uncaught}`, context && `needs ${context}`, viaText && 'drew only with a Text child']
			.filter(Boolean)
			.join('; ');
		return `| ${cell(name)} | ${status} | ${cell(size)} | ${cell(detail)} |`;
	});
	return [
		'# Fuselage native sweep',
		'',
		`${results.length} components. ${summary}.`,
		'',
		'| Component | Status | Size | Detail |',
		'| --- | --- | --- | --- |',
		...rows,
		'',
	].join('\n');
};

const server = createServer();

const metro = spawn('npx', ['expo', 'start', '--dev-client', '--port', String(metroPort)], {
	stdio: 'inherit',
	env: { ...process.env, EXPO_PUBLIC_SWEEP: '1', EXPO_PUBLIC_SWEEP_SINK: sink },
});

metro.on('exit', (code) => process.exit(code ?? 1));

const finish = (code) => {
	metro.kill();
	server.close();
	process.exit(code);
};

server.on('request', (request, response) => {
	let body = '';
	request.on('data', (chunk) => {
		body += chunk;
	});
	request.on('end', () => {
		response.end('ok');
		try {
			writeFileSync(values.out, toMarkdown(JSON.parse(body)));
		} catch (error) {
			console.error('Could not write the report:', error);
			finish(1);
		}
		console.log(`Sweep finished, table written to ${values.out}`);
		finish(0);
	});
});

server.listen(Number(values.port), () => {
	const link = `exp+expo-lab://expo-development-client/?url=${encodeURIComponent(`http://${host}:${metroPort}`)}`;
	console.log(`Waiting for the sweep report on ${sink}.`);
	console.log(`Open the app on a booted ${values.platform} device, or run: xcrun simctl openurl booted "${link}"`);
	// Only with --open: it targets whichever simulator is booted
	if (values.open && values.platform === 'ios') spawnSync('xcrun', ['simctl', 'openurl', 'booted', link], { stdio: 'inherit' });
});

process.on('SIGINT', () => finish(130));
