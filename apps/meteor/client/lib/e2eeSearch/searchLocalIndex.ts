import type { E2EESearchHit, ISearchIndexBackend } from '@rocket.chat/desktop-api';

const MAX_LOCAL_SEARCH_LIMIT = 100;

type LocalSearchParams = { searchText: string; rid: string; limit: number };

/**
 * Searches the local index of decrypted messages in one room, newest first. The query never goes to the server. Hits of
 * other rooms are dropped, so a result list shows only the room that the user searches.
 */
export const searchLocalIndex = async (
	backend: ISearchIndexBackend,
	{ searchText, rid, limit }: LocalSearchParams,
): Promise<E2EESearchHit[]> => {
	const text = searchText.trim();
	if (!text) return [];

	const hits = await backend.search({ text, rid, order: 'recent', limit: Math.min(Math.max(1, limit), MAX_LOCAL_SEARCH_LIMIT) });
	return hits.filter((hit) => hit.rid === rid);
};
