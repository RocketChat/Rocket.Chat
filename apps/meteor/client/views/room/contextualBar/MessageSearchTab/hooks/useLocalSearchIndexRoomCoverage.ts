import type { E2EESearchRoomState, ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { useQuery } from '@tanstack/react-query';

import { useLocalSearchIndexVersion } from './useLocalSearchIndexChanges';
import { useLocalSearchIndexProgress } from './useLocalSearchIndexProgress';

/** How much of the history of a room the local search index holds. `since` is set once the backfill read a page. */
export type LocalSearchIndexRoomCoverage = { done: true } | { done: false; since?: number };

/**
 * Reads the coverage from the room state. The backfill cursor (`<ms>_<id>`) holds the last update of the oldest message
 * that the backfill read. A message is never sent after its last update, so the index holds every message sent since then.
 */
export const toRoomCoverage = (state: E2EESearchRoomState | undefined): LocalSearchIndexRoomCoverage => {
	if (state?.backfillDone) return { done: true };
	const since = state?.backfillCursor === undefined ? Number.NaN : Number.parseInt(`${state.backfillCursor}`, 10);
	return Number.isFinite(since) ? { done: false, since } : { done: false };
};

/** The coverage of the room in the local search index, read again after each index change and each crawler step. */
export const useLocalSearchIndexRoomCoverage = (
	backend: ISearchIndexBackend | undefined,
	rid: string,
	enabled: boolean,
): LocalSearchIndexRoomCoverage | undefined => {
	const version = useLocalSearchIndexVersion();
	const progress = useLocalSearchIndexProgress();
	const { data } = useQuery({
		queryKey: ['e2ee-search', 'room-coverage', rid, version, progress?.roomsDone, progress?.indexed],
		queryFn: async () => toRoomCoverage(await backend?.getRoomState(rid)),
		enabled: enabled && !!backend,
		placeholderData: (previous) => previous,
	});
	return enabled ? data : undefined;
};
