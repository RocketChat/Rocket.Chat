import type { E2EESearchHit, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { parseLocalSearchQuery } from './parseLocalSearchQuery';

/** The most hits that one index call returns (`MAX_SEARCH_LIMIT` of the index). */
const INDEX_PAGE_LIMIT = 100;
/** The most hits that a local search lists: the result list asks for more as the user scrolls, up to this. */
export const MAX_LOCAL_SEARCH_LIMIT = 1000;

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
	/** Stops reading pages when the search is replaced by another one. */
	signal?: AbortSignal;
};

const clampLimit = (limit: number) => Math.min(Math.max(1, limit), MAX_LOCAL_SEARCH_LIMIT);

/**
 * Searches the local index of decrypted messages in one room, newest first. The query never goes to the server. Hits of
 * other rooms are dropped, so a result list shows only the room that the user searches. The text can carry the
 * `from:`, `before:`, `after:` and `on:` filters of the server search, also with no words. The index returns at most
 * 100 hits for each call, so the search reads more pages, each one older than the last, until it has `limit` hits.
 */
export const searchLocalIndex = async (
	backend: ISearchIndexBackend,
	{ searchText, rid, limit, self, resolveUid, utcOffset, signal }: LocalSearchParams,
): Promise<E2EESearchHit[]> => {
	const { text, usernames, fromSelf, from, to } = parseLocalSearchQuery(searchText, { utcOffset });
	// A text with only filters goes to the index with an empty text, and the index lists the newest messages of the filters.
	if (!text && usernames.length === 0 && !fromSelf && from === undefined && to === undefined) return [];

	const uids = new Set<string>();
	const unresolved = new Set<string>();
	if (fromSelf) {
		if (self) uids.add(self.uid);
		else unresolved.add('me');
	}
	for (const username of usernames) {
		const uid = resolveUid?.(username);
		if (uid) uids.add(uid);
		else unresolved.add(username);
	}

	const byAuthor = uids.size > 0 || unresolved.size > 0;
	// One known author goes to the index as a filter. More authors, or a username that the client does not know, need
	// a filter on the hits, so each page then asks for the most hits that the index returns.
	const singleUid = byAuthor && uids.size === 1 && unresolved.size === 0 ? [...uids][0] : undefined;
	const filtersHits = byAuthor && !singleUid;
	const wanted = clampLimit(limit);

	const isKept = (hit: E2EESearchHit) =>
		hit.rid === rid &&
		(!filtersHits ||
			(hit.uid !== undefined && uids.has(hit.uid)) ||
			(hit.username !== undefined && unresolved.has(hit.username.toLowerCase())));

	const kept: E2EESearchHit[] = [];
	const seen = new Set<string>();
	let pageTo = to;
	for (let first = true; ; first = false) {
		signal?.throwIfAborted();
		// After the first page, a full index page: the inclusive time bound reads some hits of the last page again.
		const pageLimit = filtersHits || !first ? INDEX_PAGE_LIMIT : Math.min(INDEX_PAGE_LIMIT, wanted);
		const page = await backend.search({
			text,
			rid,
			order: 'recent',
			limit: pageLimit,
			...(singleUid && { uid: singleUid }),
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
			if (isKept(hit)) kept.push(hit);
		}

		if (kept.length >= wanted || page.length < pageLimit) break;

		// The time bound is inclusive, so the next page starts at the oldest time again, unless that page brought nothing new.
		pageTo = fresh > 0 ? oldest : oldest - 1;
		if (from !== undefined && pageTo < from) break;
	}

	return kept.slice(0, wanted);
};
