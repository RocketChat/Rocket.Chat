import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { useSyncExternalStore } from 'react';

import { e2eSearchIndexSession } from '../../../../../lib/e2ee/rocketchat.e2e';

/** The local search index of decrypted E2EE messages while it is open, or `undefined` (no desktop backend, locked, logged out). */
export const useLocalSearchIndexBackend = (): ISearchIndexBackend | undefined =>
	useSyncExternalStore(e2eSearchIndexSession.subscribe, e2eSearchIndexSession.getActiveBackend);
