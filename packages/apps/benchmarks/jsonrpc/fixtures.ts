/**
 * Real messages exchanged between the Apps-Engine host and an app subprocess.
 *
 * Every fixture below is taken from an actual call site, not invented for the
 * benchmark:
 *
 * - `app:*` requests come from `BaseRuntimeSubprocessController` and from the
 *   handlers under `base-runtime/src/handlers/`.
 * - `bridges:*` requests come from `bridgeCall()` in
 *   `base-runtime/src/lib/bridges/bridgeCall.ts`.
 * - `log` notifications and the `{ value, logs }` result envelope come from
 *   `base-runtime/src/lib/messenger.ts`.
 * - The `app:construct` payload is the real `IParseAppPackageResult` of the
 *   test app under `tests/test-data/apps/`, unpacked by the real parser.
 *
 * A fixture describes a message in a library-neutral way: `kind` plus the
 * arguments the factory takes. Each contender builds its own object from it, so
 * neither side gets a head start.
 */
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

import { AppPackageParser } from '../../src/server/compiler/AppPackageParser';

export type Fixture =
	| { name: string; group: string; kind: 'request'; id: string; method: string; params?: unknown }
	| { name: string; group: string; kind: 'notification'; method: string; params?: unknown }
	| { name: string; group: string; kind: 'success'; id: string; result: unknown }
	| { name: string; group: string; kind: 'error'; id: string; message: string; code: number; data?: unknown };

const APP_ID = '9c1d62ca-e40f-456f-8601-17c823a16c68';

const requestId = () => Math.random().toString(36).slice(2);

/** The `{ value, logs }` envelope that `Messenger.successResponse` wraps every result in. */
function loggerEntry(method: string, entries: number) {
	const now = new Date();

	return {
		appId: APP_ID,
		method,
		startTime: now,
		endTime: now,
		totalTime: 3,
		_createdAt: now,
		entries: Array.from({ length: entries }, (_, i) => ({
			caller: 'HelloWorldApp.executePostMessageSent',
			severity: 'debug',
			method,
			timestamp: now,
			args: [`step ${i}`, { roomId: 'GENERAL', userId: 'rocket.cat' }],
		})),
	};
}

/** A message as the host hands it to `app:executePostMessageSent`. */
const messageContext = {
	id: '6h8Zq2mKZ4nQxWq3T',
	rid: 'GENERAL',
	msg: 'Hello World from the benchmark corpus',
	ts: new Date('2026-02-03T10:15:00.000Z'),
	u: { _id: 'rocket.cat', username: 'rocket.cat', name: 'Rocket.Cat' },
	_updatedAt: new Date('2026-02-03T10:15:00.000Z'),
	urls: [],
	mentions: [],
	channels: [],
	md: [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'Hello World from the benchmark corpus' }] }],
	room: {
		id: 'GENERAL',
		slugifiedName: 'general',
		displayName: 'general',
		type: 'c',
		creator: { id: 'rocket.cat', username: 'rocket.cat' },
		createdAt: new Date('2025-11-01T00:00:00.000Z'),
		usernames: [],
		isDefault: true,
		isReadOnly: false,
		displaySystemMessages: true,
		messageCount: 4213,
	},
	sender: { id: 'rocket.cat', username: 'rocket.cat', name: 'Rocket.Cat', emails: [{ address: 'cat@rocket.chat', verified: true }] },
};

/** A 64 KiB attachment: the `executePreFileUpload` path really does move Buffers over the bridge. */
const fileContents = Buffer.alloc(64 * 1024, 'RocketChatUpload');

export async function loadFixtures(): Promise<Fixture[]> {
	const appPackageBuffer = await fs.readFile(path.join(__dirname, '../../tests/test-data/apps/hello-world-test_0.0.1.zip'));
	const appPackage = await new AppPackageParser().unpackageApp(appPackageBuffer);

	return [
		// ---------------------------------------------------------------- host -> subprocess
		{
			name: 'app:getStatus',
			group: 'host->app',
			kind: 'request',
			id: requestId(),
			method: 'app:getStatus',
			params: [],
		},
		{
			name: 'app:construct (real app package)',
			group: 'host->app',
			kind: 'request',
			id: requestId(),
			method: 'app:construct',
			params: [appPackage],
		},
		{
			name: 'app:executePostMessageSent',
			group: 'host->app',
			kind: 'request',
			id: requestId(),
			method: 'app:executePostMessageSent',
			params: [messageContext],
		},
		{
			name: 'app:executePreFileUpload (64 KiB Buffer)',
			group: 'host->app',
			kind: 'request',
			id: requestId(),
			method: 'app:executePreFileUpload',
			params: [{ file: { rid: 'GENERAL', userId: 'rocket.cat', name: 'report.pdf', size: fileContents.length }, content: fileContents }],
		},
		{
			name: 'bridge result: doCreate -> messageId',
			group: 'host->app',
			kind: 'success',
			id: requestId(),
			result: 'ZzXqLg7d4mE9pWc2b',
		},
		{
			name: 'bridge result: doGetById -> user',
			group: 'host->app',
			kind: 'success',
			id: requestId(),
			result: {
				id: 'rocket.cat',
				username: 'rocket.cat',
				name: 'Rocket.Cat',
				emails: [{ address: 'cat@rocket.chat', verified: true }],
				type: 'bot',
				isEnabled: true,
				roles: ['bot'],
				status: 'online',
				utcOffset: -3,
				createdAt: new Date('2025-11-01T00:00:00.000Z'),
			},
		},
		{
			name: 'bridge error: doCreate rejected',
			group: 'host->app',
			kind: 'error',
			id: requestId(),
			message: 'Room GENERAL is read only',
			code: 1000,
		},

		// ---------------------------------------------------------------- subprocess -> host
		{
			name: 'bridges:getMessageBridge:doCreate',
			group: 'app->host',
			kind: 'request',
			id: requestId(),
			method: 'bridges:getMessageBridge:doCreate',
			params: [
				{
					room: { id: 'GENERAL' },
					sender: { id: 'rocket.cat' },
					text: 'Hello World',
					alias: 'alias',
					avatarUrl: 'https://avatars.com/123',
				},
				'APP_ID',
			],
		},
		{
			name: 'bridges:getUserBridge:doGetById',
			group: 'app->host',
			kind: 'request',
			id: requestId(),
			method: 'bridges:getUserBridge:doGetById',
			params: ['rocket.cat', 'APP_ID'],
		},
		{
			name: 'bridges:getHttpBridge:doCall',
			group: 'app->host',
			kind: 'request',
			id: requestId(),
			method: 'bridges:getHttpBridge:doCall',
			params: [
				{
					appId: APP_ID,
					method: 'post',
					url: 'https://example.com/api/v1/webhook',
					request: {
						headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer redacted' },
						data: { event: 'message.sent', payload: messageContext },
					},
				},
			],
		},
		{
			name: 'log notification (12 entries)',
			group: 'app->host',
			kind: 'notification',
			method: 'log',
			params: [loggerEntry('executePostMessageSent', 12)],
		},
		{
			name: 'ready notification',
			group: 'app->host',
			kind: 'notification',
			method: 'ready',
			params: [],
		},
		{
			name: 'app result + logs',
			group: 'app->host',
			kind: 'success',
			id: requestId(),
			result: { value: true, logs: loggerEntry('executePostMessageSent', 6) },
		},
		{
			name: 'app error + logs',
			group: 'app->host',
			kind: 'error',
			id: requestId(),
			message: 'App threw an error: Cannot read properties of undefined',
			code: -32000,
			data: { logs: loggerEntry('executePostMessageSent', 6) },
		},
	];
}
