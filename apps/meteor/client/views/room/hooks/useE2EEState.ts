import { useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import { e2e } from '../../../../app/e2e/client';
import type { E2EEState } from '../../../../app/e2e/client/E2EEState';

export const useE2EEState = (): E2EEState => {
	const subscribeE2EEState = useMemo(
		() => [(callback: () => void): (() => void) => e2e.on('E2E_STATE_CHANGED', callback), (): E2EEState => e2e.getState()] as const,
		[],
	);

	return useSyncExternalStore(...subscribeE2EEState);
};
