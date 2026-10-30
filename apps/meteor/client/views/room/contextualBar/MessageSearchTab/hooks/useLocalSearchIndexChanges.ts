import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { useCallback, useEffect, useSyncExternalStore } from 'react';

import { e2eSearchIndexRuntime, e2eSearchIndexWriter } from '../../../../../lib/e2ee/rocketchat.e2e';

const versions = new WeakMap<ISearchIndexBackend, number>();

/** Refresh displayed hits after local writes or cross-window index changes. */
export const useLocalSearchIndexVersion = (backend: ISearchIndexBackend | undefined): string => {
	const writerVersion = useSyncExternalStore(e2eSearchIndexWriter.subscribe, e2eSearchIndexWriter.getVersion);
	const subscribe = useCallback(
		(listener: () => void) =>
			backend?.onIndexEvent?.(() => {
				versions.set(backend, (versions.get(backend) ?? 0) + 1);
				listener();
			}) ?? (() => undefined),
		[backend],
	);
	const eventVersion = useSyncExternalStore(subscribe, () => (backend ? (versions.get(backend) ?? 0) : 0));
	return `${writerVersion}:${eventVersion}`;
};

export const useLocalSearchIndexRoomCatchUp = (rid: string, enabled: boolean): void => {
	useEffect(() => {
		if (enabled) e2eSearchIndexRuntime.requestRoomCatchUp(rid);
	}, [enabled, rid]);
};
