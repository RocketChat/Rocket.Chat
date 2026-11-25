import { useUserId } from '@rocket.chat/ui-contexts';
import { useSyncExternalStore } from 'react';

import { getSearchIndexBackend } from '../../../../../lib/e2eeSearch/getSearchIndexBackend';
import { isSearchIndexOptedIn, subscribeToSearchIndexOptIn } from '../../../../../lib/e2eeSearch/searchIndexOptIn';

/** Whether this device searches encrypted rooms in its local index: the user opted in and the app has an index. */
export const useLocalSearchIndexExpected = (): boolean => {
	const userId = useUserId() ?? undefined;
	const optedIn = useSyncExternalStore(subscribeToSearchIndexOptIn, () => isSearchIndexOptedIn(userId));
	return optedIn && !!getSearchIndexBackend();
};
