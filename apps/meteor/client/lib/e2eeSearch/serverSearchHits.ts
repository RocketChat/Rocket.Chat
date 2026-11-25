import type { IMessage } from '@rocket.chat/core-typings';
import type { E2EESearchHit } from '@rocket.chat/desktop-api';

/** A hit of the search list. `encrypted` marks a hit of the local index, which holds only encrypted messages. */
export type SearchListHit = E2EESearchHit & { encrypted?: boolean };

/** The most characters of a server message that a hit shows. */
const MAX_SNIPPET_LENGTH = 300;

const escapeHtml = (text: string): string =>
	text.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string);

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The words of the search text that a hit highlights: filters such as `from:jean` are not words of the message. */
const searchWords = (searchText: string): string[] => searchText.split(/\s+/).filter((word) => word && !word.includes(':'));

// A file message has no text: its caption, else its file name.
const textOf = (message: IMessage): string =>
	message.msg?.trim()
		? message.msg
		: (message.attachments
				?.map((attachment) => (attachment as { description?: unknown }).description)
				.find((description): description is string => typeof description === 'string' && !!description.trim()) ??
			message.file?.name ??
			'');

/**
 * Turns a message that the server search found into a hit of the local search list. Only a message that is not
 * encrypted gives a hit: the server cannot read the text of an encrypted message, and the local index has it. A message
 * outside the date window of the local search gives no hit, so both sources list the same days.
 */
export const toServerSearchHit = (
	message: IMessage,
	searchText: string,
	{ from, to }: { from?: number; to?: number } = {},
): SearchListHit | undefined => {
	if (message.t) return undefined;
	const ts = new Date(message.ts).getTime();
	if ((from !== undefined && ts < from) || (to !== undefined && ts > to)) return undefined;
	const text = textOf(message).slice(0, MAX_SNIPPET_LENGTH);
	if (!text.trim() || !message.u?._id) return undefined;

	const words = searchWords(searchText);
	const pattern = words.length ? new RegExp(`(${words.map(escapeRegExp).join('|')})`, 'gi') : undefined;
	const snippet = pattern
		? text
				.split(pattern)
				.map((part, index) => (index % 2 ? `<mark>${escapeHtml(part)}</mark>` : escapeHtml(part)))
				.join('')
		: escapeHtml(text);

	return {
		id: message._id,
		rid: message.rid,
		...(message.tmid && { tmid: message.tmid }),
		uid: message.u._id,
		username: message.u.username ?? '',
		ts,
		snippet,
	};
};

export type SearchHitSource = {
	hits: SearchListHit[];
	/** The source returned a full page, so older hits can exist. */
	mayHaveMore: boolean;
	/** The time of the oldest message that the source read, also when that message gave no hit. */
	oldestTs?: number;
};

/**
 * Merges the hits of the local index and of the server, newest first. Each source reads only its newest page, so the list
 * stops at the oldest message of a source that can have more: an older hit of the other source could skip one of its hits.
 */
export const mergeSearchHits = (sources: SearchHitSource[]): SearchListHit[] => {
	const boundary = Math.max(
		-Infinity,
		...sources.filter(({ mayHaveMore, oldestTs }) => mayHaveMore && oldestTs !== undefined).map(({ oldestTs }) => oldestTs as number),
	);
	const byId = new Map<string, SearchListHit>();
	for (const { hits } of sources) for (const hit of hits) if (!byId.has(hit.id)) byId.set(hit.id, hit);
	return [...byId.values()].filter(({ ts }) => ts >= boundary).sort((a, b) => b.ts - a.ts);
};
