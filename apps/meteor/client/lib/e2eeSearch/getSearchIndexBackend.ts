import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { absoluteUrl } from '../absoluteUrl';
import { canRunBrowserBackend } from './browser/canRunBrowserBackend';
import { createSharedSqlRunner } from './browser/sharedSqlRunner';
import { createSqliteSearchIndexBackend } from './browser/sqliteSearchIndexBackend';
import { createWorkerSqlRunner } from './browser/workerSqlRunner';
import { getDesktopSearchIndexBackend } from './desktopSearchIndexBackend';
import { createFakeSearchIndexBackend } from './fakeSearchIndexBackend';

export const FAKE_BACKEND_STORAGE_KEY = 'E2EESearch_FakeBackend';
let fakeBackend: ISearchIndexBackend | undefined;
let browserBackend: ISearchIndexBackend | undefined;

const isFakeBackendEnabled = () => {
	if (process.env.NODE_ENV !== 'development') return false;
	try {
		return window.localStorage.getItem(FAKE_BACKEND_STORAGE_KEY) === 'true';
	} catch {
		return false;
	}
};

/** Select desktop storage without permitting a browser fallback inside desktop. */
export const getSearchIndexBackend = (): ISearchIndexBackend | undefined => {
	const desktop = getDesktopSearchIndexBackend();
	if (desktop) return desktop;
	if (window.RocketChatDesktop) return undefined;
	if (isFakeBackendEnabled()) {
		fakeBackend ??= createFakeSearchIndexBackend();
		return fakeBackend;
	}
	if (!canRunBrowserBackend()) return undefined;
	const namespace = absoluteUrl('');
	browserBackend ??= createSqliteSearchIndexBackend(
		createSharedSqlRunner(`rc-e2ee-search:${namespace}`, () => createWorkerSqlRunner(absoluteUrl('workers/e2ee-search/worker.mjs'))),
		{ namespace },
	);
	return browserBackend;
};
