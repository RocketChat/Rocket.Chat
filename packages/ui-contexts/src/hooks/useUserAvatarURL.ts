import { useCallback, useContext } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { AvatarUrlContext } from '../AvatarUrlContext';

export const useUserAvatarURL = (username: string): string => {
	const { getUserAvatarURL, subscribeToUserAvatarURL } = useContext(AvatarUrlContext);
	const subscribe = useCallback(
		(callback: () => void) => subscribeToUserAvatarURL(username, callback),
		[subscribeToUserAvatarURL, username],
	);
	const getSnapshot = useCallback(() => getUserAvatarURL(username), [getUserAvatarURL, username]);
	return useSyncExternalStore(subscribe, getSnapshot);
};
