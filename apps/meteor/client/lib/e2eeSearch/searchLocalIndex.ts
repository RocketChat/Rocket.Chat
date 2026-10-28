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
	/** The `utcOffset` of the logged-in user, which sets the day boundaries of the date filters. */
	utcOffset?: number;
};

const clampLimit = (limit: number) => Math.min(Math.max(1, limit), MAX_LOCAL_SEARCH_LIMIT);

/**
 * Searches the local index of decrypted messages in one room, newest first. The query never goes to the server. Hits of
 * other rooms are dropped, so a result list shows only the room that the user searches. The text can carry the
 * `from:`, `before:`, `after:` and `on:` filters of the server search, also with no words.
 */
export const searchLocalIndex = async (
	backend: ISearchIndexBackend,
	{ searchText, rid, limit, self, resolveUid, utcOffset }: LocalSearchParams,
): Promise<E2EESearchHit[]> => {
	const { text, usernames, from, to } = parseLocalSearchQuery(searchText, { utcOffset });
	// A text with only filters goes to the index with an empty text, and the index lists the newest messages of the filters.
	if (!text && usernames.length === 0 && from === undefined && to === undefined) return [];

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
	// a filter on the hits, so the search then reads the hits page by page, newest first.
	const singleUid = byAuthor && uids.size === 1 && unresolved.size === 0 ? [...uids][0] : undefined;
	const wanted = clampLimit(limit);

	if (!byAuthor || singleUid) {
		const hits = await backend.search({
			text,
			rid,
			order: 'recent',
			limit: wanted,
			...(singleUid && { uid: singleUid }),
			...range,
		});
		return hits.filter((hit) => hit.rid === rid).slice(0, wanted);
	}

	const isByAuthor = (hit: E2EESearchHit) =>
		(hit.uid !== undefined && uids.has(hit.uid)) || (hit.username !== undefined && unresolved.has(hit.username.toLowerCase()));

	const kept: E2EESearchHit[] = [];
	const seen = new Set<string>();
	let pageTo = to;
	for (;;) {
		const page = await backend.search({
			text,
			rid,
			order: 'recent',
			limit: MAX_LOCAL_SEARCH_LIMIT,
			...(from !== undefined && { from }),
			...(pageTo !== undefined && { to: pageTo }),
		});

		let oldest = Number.POSITIVE_INFINITY;
		let fresh = 0;
		for (const hit of page) {
			oldest = Math.min(oldest, hit.ts);
			if (seen.has(hit.id)) continue;
			seen.add(hit.id);
			fresh++;
			if (hit.rid === rid && isByAuthor(hit)) kept.push(hit);
		}

		if (kept.length >= wanted || page.length < MAX_LOCAL_SEARCH_LIMIT) break;

		// The time bound is inclusive, so the next page starts at the oldest time again, unless that page brought nothing new.
		pageTo = fresh > 0 ? oldest : oldest - 1;
		if (from !== undefined && pageTo < from) break;
	}

	return kept.slice(0, wanted);
};
