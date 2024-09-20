import { useMemo } from 'react';
import { useSyncExternalStore } from 'use-sync-external-store/shim';

import type { E2ERoomState } from '../../../../app/e2e/client/E2ERoomState';
import { useE2EERoom } from './useE2EERoom';

export const useE2EERoomState = (rid: string) => {
	const e2eRoom = useE2EERoom(rid);

	const subscribeE2EERoomState = useMemo(
		() =>
			[
				(callback: () => void): (() => void) => (e2eRoom ? e2eRoom.onStateChange(callback) : () => undefined),
				(): E2ERoomState | undefined => (e2eRoom ? e2eRoom.getState() : undefined),
			] as const,
		[e2eRoom],
	);

	return useSyncExternalStore(...subscribeE2EERoomState);
};
