import { useEffect, useSyncExternalStore } from 'react';

import { e2eSearchIndexRuntime, e2eSearchIndexWriter } from '../../../../../lib/e2ee/rocketchat.e2e';

/** Counts the changes of the local search index (documents added or removed), so a local search runs again after each one. */
export const useLocalSearchIndexVersion = (): number =>
	useSyncExternalStore(e2eSearchIndexWriter.subscribe, e2eSearchIndexWriter.getVersion);

/**
 * Catches up the room in the local search index while its search is open, so the search finds its edits and no longer
 * finds the messages deleted while the room was not open.
 */
export const useLocalSearchIndexRoomCatchUp = (rid: string, enabled: boolean): void => {
	useEffect(() => {
		if (enabled) e2eSearchIndexRuntime.requestRoomCatchUp(rid);
	}, [enabled, rid]);
};
