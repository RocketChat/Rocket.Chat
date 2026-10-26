import type { E2EESearchHit, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { parseLocalSearchQuery } from './parseLocalSearchQuery';

const MAX_LOCAL_SEARCH_LIMIT = 100;

type LocalSearchParams = {
	searchText: string;
	rid: string;
	limit: number;
	/** The logged-in user, for `from:me`. */
	self?: { uid: string };
	/** Finds the user id of a username in the data that the client has already loaded. It sends no request. */
	resolveUid?: (username: string) => string | undefined;
};

const clampLimit = (limit: number) => Math.min(Math.max(1, limit), MAX_LOCAL_SEARCH_LIMIT);

/**
 * Searches the local index of decrypted messages in one room, newest first. The query never goes to the server. Hits of
 * other rooms are dropped, so a result list shows only the room that the user searches. The text can carry the
 * `from:`, `before:`, `after:` and `on:` filters of the server search.
 */
export const searchLocalIndex = async (
	backend: ISearchIndexBackend,
	{ searchText, rid, limit, self, resolveUid }: LocalSearchParams,
): Promise<E2EESearchHit[]> => {
	const { text, usernames, from, to } = parseLocalSearchQuery(searchText);
	if (!text) return [];

	const uids = new Set<string>();
	const unresolved = new Set<string>();
	for (const username of usernames) {
		if (username === 'me' && self) {
			uids.add(self.uid);
			continue;
		}
		const uid = resolveUid?.(username);
		if (uid) uids.add(uid);
		else unresolved.add(username);
	}

	const range = { ...(from !== undefined && { from }), ...(to !== undefined && { to }) };
	const byAuthor = usernames.length > 0;
	// One known author goes to the index as a filter. More authors, or a username that the client does not know, need
	// a filter on the hits, so the search then asks for the most hits that it can.
	const singleUid = byAuthor && uids.size === 1 && unresolved.size === 0 ? [...uids][0] : undefined;
	const filterHits = byAuthor && !singleUid;

	const hits = await backend.search({
		text,
		rid,
		order: 'recent',
		limit: filterHits ? MAX_LOCAL_SEARCH_LIMIT : clampLimit(limit),
		...(singleUid && { uid: singleUid }),
		...range,
	});

	return hits
		.filter((hit) => hit.rid === rid)
		.filter(
			(hit) =>
				!filterHits ||
				(hit.uid !== undefined && uids.has(hit.uid)) ||
				(hit.username !== undefined && unresolved.has(hit.username.toLowerCase())),
		)
		.slice(0, clampLimit(limit));
};
