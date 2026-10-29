import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import { useSyncExternalStore } from 'react';

import { getSearchIndexBackend } from '../../../../../lib/e2eeSearch/getSearchIndexBackend';
import { isSearchIndexOptedIn, subscribeToSearchIndexOptIn } from '../../../../../lib/e2eeSearch/searchIndexOptIn';

/**
 * Whether this device searches encrypted rooms in its local index: the workspace allows it, the user opted in, and the
 * app has an index. Until the index opens (E2EE locked, the open in flight), such a search waits and sends nothing to
 * the server.
 */
export const useLocalSearchIndexExpected = (): boolean => {
	const userId = useUserId() ?? undefined;
	const allowed = useSetting('E2E_Enable_Local_Search', false);
	const optedIn = useSyncExternalStore(subscribeToSearchIndexOptIn, () => isSearchIndexOptedIn(userId));
	return allowed && optedIn && !!getSearchIndexBackend();
};
