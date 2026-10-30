import type { E2EESearchOpenResult, ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { useSyncExternalStore } from 'react';

import { e2eSearchIndexSession } from '../../../../../lib/e2ee/rocketchat.e2e';
import type { SearchIndexSessionStatus } from '../../../../../lib/e2eeSearch/searchIndexSession';

export const supportsLocalSearch = (backend: ISearchIndexBackend | undefined, opened: E2EESearchOpenResult | undefined): boolean =>
	!!backend &&
	!!opened &&
	!opened.locked &&
	opened.capabilities?.recentCursor === 1 &&
	opened.capabilities.lifecycleEvents === 1 &&
	opened.capabilities.close === 1 &&
	typeof backend.searchRecentPage === 'function' &&
	typeof backend.onIndexEvent === 'function' &&
	typeof backend.close === 'function';

export const useLocalSearchIndexBackend = (): ISearchIndexBackend | undefined =>
	useSyncExternalStore(e2eSearchIndexSession.subscribe, e2eSearchIndexSession.getActiveBackend);

export const useLocalSearchIndexOpenResult = (): E2EESearchOpenResult | undefined =>
	useSyncExternalStore(e2eSearchIndexSession.subscribe, e2eSearchIndexSession.getOpenResult);

export const useLocalSearchIndexStatus = (): SearchIndexSessionStatus =>
	useSyncExternalStore(e2eSearchIndexSession.subscribe, e2eSearchIndexSession.getStatus);
