import { Accounts } from 'meteor/accounts-base';
import { useSyncExternalStore } from 'react';

import { getMessageBoxStorageKey } from '../../lib/utils/getMessageBoxStorageKey';

export const useRoomDraft = (roomId: string): boolean => {
	return useSyncExternalStore(
		(callback) => {
			const storageKey = getMessageBoxStorageKey(roomId);

			const handleStorageChange = (e: StorageEvent | Event | CustomEvent) => {
				if ('key' in e && (e.key === storageKey || e.key === null)) {
					callback();
				} else if ('detail' in e && e.detail?.key === storageKey) {
					callback();
				}
			};

			window.addEventListener('storage', handleStorageChange);
			window.addEventListener('localStorageChange', handleStorageChange);

			return () => {
				window.removeEventListener('storage', handleStorageChange);
				window.removeEventListener('localStorageChange', handleStorageChange);
			};
		},
		() => {
			const draft = Accounts.storageLocation.getItem(getMessageBoxStorageKey(roomId));
			return !!draft && !!draft.trim().length;
		},
	);
};
