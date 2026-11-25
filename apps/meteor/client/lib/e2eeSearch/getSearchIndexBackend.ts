import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { getDesktopSearchIndexBackend } from './desktopSearchIndexBackend';
import { createFakeSearchIndexBackend } from './fakeSearchIndexBackend';

/** Set this local storage key to `true` in a development build to search E2EE rooms with a memory-only index. */
export const FAKE_BACKEND_STORAGE_KEY = 'E2EESearch_FakeBackend';

let fakeBackend: ISearchIndexBackend | undefined;

const isFakeBackendEnabled = (): boolean => {
	if (process.env.NODE_ENV !== 'development') return false;
	try {
		return window.localStorage.getItem(FAKE_BACKEND_STORAGE_KEY) === 'true';
	} catch {
		return false;
	}
};

/**
 * Returns the local search index for end-to-end encrypted messages: the desktop app's index, or a memory-only fake in a
 * development build with the dev flag set. `undefined` leaves encrypted rooms without search.
 */
export const getSearchIndexBackend = (): ISearchIndexBackend | undefined => {
	const desktopBackend = getDesktopSearchIndexBackend();
	if (desktopBackend) return desktopBackend;

	if (window.RocketChatDesktop) return undefined;

	if (isFakeBackendEnabled()) {
		fakeBackend ??= createFakeSearchIndexBackend();
		return fakeBackend;
	}

	return undefined;
};
