import { E2EE_SEARCH_LIMITS } from '@rocket.chat/desktop-api';
import type { E2EESearchHit, E2EESearchOpenResult, E2EESearchRecentCursor, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { parseLocalSearchQuery } from './parseLocalSearchQuery';

export const MAX_LOCAL_SEARCH_LIMIT = 1000;

type LocalSearchParams = {
	openResult: E2EESearchOpenResult;
	searchText: string;
	rid: string;
	limit: number;
	self?: { uid: string };
	resolveUid?: (username: string) => string | undefined;
	utcOffset?: number;
	signal?: AbortSignal;
};

const clampLimit = (limit: number) => {
	if (!Number.isFinite(limit)) throw new RangeError('Invalid local search limit');
	return Math.min(Math.max(1, Math.floor(limit)), MAX_LOCAL_SEARCH_LIMIT);
};

const isCursor = (cursor: E2EESearchRecentCursor) =>
	Number.isSafeInteger(cursor.ts) && typeof cursor.id === 'string' && cursor.id.length > 0;

const compareIds = (left: string, right: string): number => {
	const encoder = new TextEncoder();
	const leftBytes = encoder.encode(left);
	const rightBytes = encoder.encode(right);
	for (let i = 0; i < Math.min(leftBytes.length, rightBytes.length); i++) {
		if (leftBytes[i] !== rightBytes[i]) return leftBytes[i] - rightBytes[i];
	}
	return leftBytes.length - rightBytes.length;
};

const isAfter = (hit: E2EESearchRecentCursor, cursor: E2EESearchRecentCursor) =>
	hit.ts < cursor.ts || (hit.ts === cursor.ts && compareIds(hit.id, cursor.id) < 0);

/** Read recent room hits through the approved cursor contract. Reject unsupported backends without creating a fallback. */
export const searchLocalIndex = async (
	backend: ISearchIndexBackend,
	{ openResult, searchText, rid, limit, self, resolveUid, utcOffset, signal }: LocalSearchParams,
): Promise<E2EESearchHit[]> => {
	const { capabilities } = openResult;
	if (
		openResult.locked ||
		capabilities?.recentCursor !== 1 ||
		capabilities.lifecycleEvents !== 1 ||
		capabilities.close !== 1 ||
		typeof backend.searchRecentPage !== 'function' ||
		typeof backend.onIndexEvent !== 'function' ||
		typeof backend.close !== 'function'
	) {
		throw new Error('Local search backend does not support the required capabilities');
	}
	const wanted = clampLimit(limit);
	if (!rid) throw new Error('Local search requires a room ID');
	const { text, usernames, fromSelf, from, to } = parseLocalSearchQuery(searchText, { utcOffset });
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
	const singleUid = byAuthor && uids.size === 1 && unresolved.size === 0 ? [...uids][0] : undefined;
	const filtersHits = byAuthor && !singleUid;
	const isKept = (hit: E2EESearchHit) =>
		hit.rid === rid &&
		(singleUid === undefined || hit.uid === singleUid) &&
		(from === undefined || hit.ts >= from) &&
		(to === undefined || hit.ts <= to) &&
		(!filtersHits || uids.has(hit.uid) || unresolved.has(hit.username.toLowerCase()));

	const kept: E2EESearchHit[] = [];
	const seen = new Set<string>();
	let cursor: E2EESearchRecentCursor | undefined;
	for (;;) {
		signal?.throwIfAborted();
		const pageLimit = filtersHits ? E2EE_SEARCH_LIMITS.maxResults : Math.min(E2EE_SEARCH_LIMITS.maxResults, wanted - kept.length);
		const page = await backend.searchRecentPage({
			text,
			rid,
			limit: pageLimit,
			...(singleUid && { uid: singleUid }),
			...(from !== undefined && { from }),
			...(to !== undefined && { to }),
			...(cursor && { cursor }),
		});
		signal?.throwIfAborted();
		if (page.hits.length > pageLimit) throw new Error('Local search backend exceeded the page limit');

		let previous = cursor;
		for (const hit of page.hits) {
			if (!isCursor(hit) || (previous && !isAfter(hit, previous))) throw new Error('Invalid local search page order');
			previous = hit;
			if (seen.has(hit.id)) continue;
			seen.add(hit.id);
			if (isKept(hit)) kept.push(hit);
		}

		const next = page.nextCursor;
		if (next) {
			const last = page.hits.at(-1);
			if (!isCursor(next) || !last || next.ts !== last.ts || next.id !== last.id) {
				throw new Error('Invalid local search continuation cursor');
			}
		}
		if (kept.length >= wanted || !next) break;
		cursor = next;
	}

	return kept.slice(0, wanted);
};
