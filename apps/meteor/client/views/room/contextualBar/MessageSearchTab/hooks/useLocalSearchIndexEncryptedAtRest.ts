import { useSyncExternalStore } from 'react';

import { e2eSearchIndexSession } from '../../../../../lib/e2ee/rocketchat.e2e';

/** Whether the open local search index is encrypted on disk: `false` when it is kept in memory only, `undefined` while it is not open. */
export const useLocalSearchIndexEncryptedAtRest = (): boolean | undefined =>
	useSyncExternalStore(e2eSearchIndexSession.subscribe, e2eSearchIndexSession.isEncryptedAtRest);
