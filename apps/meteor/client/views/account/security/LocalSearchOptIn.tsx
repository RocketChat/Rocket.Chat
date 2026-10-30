import { useSetting, useUserId } from '@rocket.chat/ui-contexts';
import type { ChangeEvent } from 'react';
import { useCallback, useSyncExternalStore } from 'react';

import LocalSearchOptInField from './LocalSearchOptInField';
import { absoluteUrl } from '../../../lib/absoluteUrl';
import { getSearchIndexBackend } from '../../../lib/e2eeSearch/getSearchIndexBackend';
import { isSearchIndexOptedIn, setSearchIndexOptIn, subscribeToSearchIndexOptIn } from '../../../lib/e2eeSearch/searchIndexOptIn';

const LocalSearchOptIn = () => {
	const userId = useUserId() ?? undefined;
	const adminAllows = useSetting('E2E_Enable_Local_Search', false);
	const workspaceUrl = absoluteUrl('');
	const subscribe = useCallback((listener: () => void) => subscribeToSearchIndexOptIn(workspaceUrl, listener), [workspaceUrl]);
	const getSnapshot = useCallback(() => isSearchIndexOptedIn(workspaceUrl, userId), [workspaceUrl, userId]);
	const optedIn = useSyncExternalStore(subscribe, getSnapshot);

	const handleChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			if (!userId) return;
			setSearchIndexOptIn(workspaceUrl, userId, event.currentTarget.checked);
		},
		[workspaceUrl, userId],
	);

	if (!adminAllows || !userId || !getSearchIndexBackend()) return null;

	return <LocalSearchOptInField checked={optedIn} onChange={handleChange} />;
};

export default LocalSearchOptIn;
