import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { canRunBrowserBackend } from '../../client/lib/e2eeSearch/browser/canRunBrowserBackend';
import { createSharedSqlRunner, type SharedSqlRunner } from '../../client/lib/e2eeSearch/browser/sharedSqlRunner';
import { createSqliteSearchIndexBackend } from '../../client/lib/e2eeSearch/browser/sqliteSearchIndexBackend';
import { createWorkerSqlRunner, type SqlRunner } from '../../client/lib/e2eeSearch/browser/workerSqlRunner';

const WORKER_URL = '/workers/e2ee-search/worker.mjs';

// Lets the Playwright side make backends in this page, call their methods by name, and save them to disk now.
// `create` gives a backend with its own worker. `createShared` gives the backend that the app uses: one leader tab of
// the origin runs the worker for every tab.
const backends: { backend: ISearchIndexBackend; runner: SqlRunner | SharedSqlRunner }[] = [];

const add = (runner: SqlRunner | SharedSqlRunner, namespace: string) =>
	backends.push({ backend: createSqliteSearchIndexBackend(runner, { namespace }), runner }) - 1;

// A driver that sends the arguments as JSON gives the wrap key as an array of numbers. The backend takes bytes.
const withWrapKeyBytes = (method: string, args: unknown[]): unknown[] => {
	const [scope, ...rest] = args as [{ wrapKey?: unknown } | undefined, ...unknown[]];
	if (method !== 'open' || !Array.isArray(scope?.wrapKey)) return args;
	return [{ ...scope, wrapKey: Uint8Array.from(scope.wrapKey as number[]) }, ...rest];
};

Object.assign(window, {
	e2eeSearchTest: {
		create: (namespace: string, workerUrl = WORKER_URL) => add(createWorkerSqlRunner(workerUrl), namespace),
		canRun: () => canRunBrowserBackend(),
		createShared: (namespace: string) =>
			add(
				createSharedSqlRunner(`rc-e2ee-search:${namespace}`, () => createWorkerSqlRunner(WORKER_URL)),
				namespace,
			),
		isLeader: (id: number) => {
			const { runner } = backends[id];
			return 'isLeader' in runner ? runner.isLeader() : true;
		},
		call: (id: number, method: keyof ISearchIndexBackend, args: unknown[]) =>
			(backends[id].backend[method] as (...rest: unknown[]) => Promise<unknown>)(...withWrapKeyBytes(method, args)),
		flush: (id: number) => backends[id].runner.flush(),
	},
});
