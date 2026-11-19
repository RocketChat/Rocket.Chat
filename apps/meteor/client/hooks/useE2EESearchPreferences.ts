import { useUserId } from '@rocket.chat/ui-contexts';
import { useCallback, useSyncExternalStore } from 'react';

import { e2eSearchIndexNamespace } from '../lib/e2ee/rocketchat.e2e';
import type { SearchIndexPreferences } from '../lib/e2eeSearch/searchIndexPreferences';
import { getSearchIndexPreferences, subscribeToSearchIndexPreferences } from '../lib/e2eeSearch/searchIndexPreferences';

/** The user's preferences for the local search of encrypted messages on this device, read again after each change. */
export const useE2EESearchPreferences = (): SearchIndexPreferences => {
	const userId = useUserId() ?? undefined;
	const getSnapshot = useCallback(() => getSearchIndexPreferences(e2eSearchIndexNamespace, userId), [userId]);
	return useSyncExternalStore(subscribeToSearchIndexPreferences, getSnapshot);
};
