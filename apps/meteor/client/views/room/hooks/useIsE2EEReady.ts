import { useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { e2e } from '../../../../app/e2e/client';

export const useIsE2EEReady = (): boolean => {
	const subscribeE2EEState = useMemo(
		() => [(callback: () => void): (() => void) => e2e.on('E2E_STATE_CHANGED', callback), (): boolean => e2e.isReady()] as const,
		[],
	);

	return useSyncExternalStore(...subscribeE2EEState);
};
