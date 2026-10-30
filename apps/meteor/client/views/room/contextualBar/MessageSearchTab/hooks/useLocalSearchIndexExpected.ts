import type { E2EESearchOpenResult } from '@rocket.chat/desktop-api';
import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useSyncExternalStore } from 'react';

import { absoluteUrl } from '../../../../../lib/absoluteUrl';
import { getSearchIndexBackend } from '../../../../../lib/e2eeSearch/getSearchIndexBackend';
import { isSearchIndexOptedIn, subscribeToSearchIndexOptIn } from '../../../../../lib/e2eeSearch/searchIndexOptIn';
import type { SearchIndexSessionStatus } from '../../../../../lib/e2eeSearch/searchIndexSession';

/** Keep encrypted-room queries local while an allowed index opens. */
export const useLocalSearchIndexExpected = (opened?: E2EESearchOpenResult, status?: SearchIndexSessionStatus): boolean => {
	const userId = useUserId() ?? undefined;
	const allowed = useSetting('E2E_Enable_Local_Search', false);
	const workspace = absoluteUrl('');
	const subscribe = useCallback((listener: () => void) => subscribeToSearchIndexOptIn(workspace, listener), [workspace]);
	const optedIn = useSyncExternalStore(subscribe, () => isSearchIndexOptedIn(workspace, userId));
	if (!allowed || !optedIn) return false;
	if (status === 'unsupported') return false;
	if (
		opened &&
		!opened.locked &&
		(opened.capabilities?.recentCursor !== 1 || opened.capabilities.lifecycleEvents !== 1 || opened.capabilities.close !== 1)
	) {
		return false;
	}
	const backend = getSearchIndexBackend();
	if (!backend) return status === 'locked' || status === 'unavailable';
	return (
		typeof backend.searchRecentPage === 'function' && typeof backend.onIndexEvent === 'function' && typeof backend.close === 'function'
	);
};
