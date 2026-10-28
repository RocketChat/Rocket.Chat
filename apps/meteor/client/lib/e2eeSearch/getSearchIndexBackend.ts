import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { absoluteUrl } from '../absoluteUrl';
import { canRunBrowserBackend } from './browser/canRunBrowserBackend';
import { createSharedSqlRunner } from './browser/sharedSqlRunner';
import { createSqliteSearchIndexBackend } from './browser/sqliteSearchIndexBackend';
import { createWorkerSqlRunner } from './browser/workerSqlRunner';
import { getDesktopSearchIndexBackend } from './desktopSearchIndexBackend';
import { createFakeSearchIndexBackend } from './fakeSearchIndexBackend';

/** Set this local storage key to `true` in a development build to search E2EE rooms with a memory-only index. */
export const FAKE_BACKEND_STORAGE_KEY = 'E2EESearch_FakeBackend';

let fakeBackend: ISearchIndexBackend | undefined;
let browserBackend: ISearchIndexBackend | undefined;

const isFakeBackendEnabled = (): boolean => {
	if (process.env.NODE_ENV !== 'development') return false;
	try {
		return window.localStorage.getItem(FAKE_BACKEND_STORAGE_KEY) === 'true';
	} catch {
		return false;
	}
};

/**
 * Returns the local search index for end-to-end encrypted messages: the desktop app's index when it has one, a
 * memory-only fake in a development build with the dev flag set, the browser's SQLite index when the browser can run
 * it, or `undefined`. Without a backend, encrypted rooms keep today's behavior: they cannot be searched.
 */
export const getSearchIndexBackend = (): ISearchIndexBackend | undefined => {
	const desktopBackend = getDesktopSearchIndexBackend();
	if (desktopBackend) return desktopBackend;

	if (isFakeBackendEnabled()) {
		fakeBackend ??= createFakeSearchIndexBackend();
		return fakeBackend;
	}

	if (!canRunBrowserBackend()) return undefined;

	// The server URL keeps the index of each server apart, also for servers under a path of one origin. The tabs of one
	// server share one index: one leader tab runs the worker, and the other tabs send it their calls.
	const namespace = absoluteUrl('');
	browserBackend ??= createSqliteSearchIndexBackend(
		createSharedSqlRunner(`rc-e2ee-search:${namespace}`, () => createWorkerSqlRunner(absoluteUrl('workers/e2ee-search/worker.mjs'))),
		{ namespace },
	);
	return browserBackend;
};
