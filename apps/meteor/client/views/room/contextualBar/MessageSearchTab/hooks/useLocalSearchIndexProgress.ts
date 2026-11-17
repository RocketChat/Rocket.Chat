import { useSyncExternalStore } from 'react';

import { e2eSearchIndexRuntime } from '../../../../../lib/e2ee/rocketchat.e2e';
import type { SearchIndexProgress } from '../../../../../lib/e2eeSearch/searchIndexScheduler';

/** The indexing progress of the local search index of decrypted E2EE messages while it is open, or `undefined`. */
export const useLocalSearchIndexProgress = (): SearchIndexProgress | undefined =>
	useSyncExternalStore(e2eSearchIndexRuntime.subscribe, e2eSearchIndexRuntime.getProgress);
