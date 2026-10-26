import type { IMessage } from '@rocket.chat/core-typings';

import type { SyncMessagesPage } from '../../../client/lib/e2eeSearch/searchIndexCrawler';

type Trashed = { _id: string; rid: string; _deletedAt: Date };

/** Any `chat.syncMessages` query, also the shapes the crawler must not send, so a spec can catch them. */
export type AnySyncMessagesParams = {
	roomId: string;
	type?: 'UPDATED' | 'DELETED';
	count?: number;
	next?: string;
	previous?: string;
	lastUpdate?: string;
};

/**
 * An in-memory `chat.syncMessages` with the paging rules of `handleCursorPagination` and `handleWithoutPagination`
 * (`server/publications/messages.ts`): cursors are `_updatedAt` (or `_deletedAt`) in milliseconds, compared strictly,
 * and a call without a cursor has no page-size limit. Every write moves the server clock forward by 1 ms.
 */
export const createSyncMessagesServerMock = ({ startAt }: { startAt: number }) => {
	let clock = startAt;
	const messages = new Map<string, IMessage>();
	const trash = new Map<string, Trashed>();
	const calls: AnySyncMessagesParams[] = [];

	const tick = () => {
		clock += 1;
		return clock;
	};

	const message = (id: string, rid: string, ts: number, updatedAt: number): IMessage =>
		({
			_id: id,
			rid,
			t: 'e2e',
			e2e: 'pending',
			msg: `ciphertext ${id} ${updatedAt}`,
			u: { _id: 'u2', username: 'bob' },
			ts: new Date(ts),
			_updatedAt: new Date(updatedAt),
		}) as IMessage;

	const sortedBy = <T>(items: T[], key: (item: T) => number, direction: 1 | -1) => [...items].sort((a, b) => (key(a) - key(b)) * direction);

	const updatedAtOf = (item: IMessage) => item._updatedAt.getTime();
	const deletedAtOf = (item: Trashed) => item._deletedAt.getTime();

	const page = <T>(items: T[], key: (item: T) => number, count: number, next?: string, previous?: string) => {
		const selected = previous
			? sortedBy(
					items.filter((item) => key(item) < Number(previous)),
					key,
					-1,
				)
			: sortedBy(
					items.filter((item) => key(item) > Number(next)),
					key,
					1,
				);
		const response = selected.slice(0, count + 1);

		const cursorOf = (item: T | undefined) => (item === undefined ? null : `${key(item)}`);
		let nextCursor: string | null;
		let previousCursor: string | null;
		if (response.length === 0) {
			nextCursor = null;
			previousCursor = null;
		} else if (previous) {
			nextCursor = cursorOf(response[0]);
			previousCursor = response.length > count ? cursorOf(response[response.length - 2]) : null;
		} else {
			nextCursor = response.length > count ? cursorOf(response[response.length - 2]) : null;
			previousCursor = cursorOf(response[0]);
		}

		if (response.length > count) response.pop();
		return { items: response, cursor: { next: nextCursor, previous: previousCursor } };
	};

	return {
		calls,
		now: () => clock,
		/** Moves the server clock, as time passes between two crawler runs. */
		advance(ms: number) {
			clock += ms;
		},
		/** Adds a message sent at `ts` (server time) that nobody changed since. */
		addHistory(id: string, rid: string, ts: number) {
			messages.set(id, message(id, rid, ts, ts));
		},
		send(id: string, rid: string) {
			const at = tick();
			messages.set(id, message(id, rid, at, at));
		},
		edit(id: string) {
			const current = messages.get(id);
			if (!current) throw new Error(`no message ${id}`);
			messages.set(id, message(id, current.rid, current.ts.getTime(), tick()));
		},
		remove(id: string) {
			const current = messages.get(id);
			if (!current) throw new Error(`no message ${id}`);
			messages.delete(id);
			trash.set(id, { _id: id, rid: current.rid, _deletedAt: new Date(tick()) });
		},
		/** The newest version of each message of the room that is not deleted, as `id -> _updatedAt`. */
		liveVersions(rid: string): Map<string, number> {
			return new Map([...messages.values()].filter((item) => item.rid === rid).map((item) => [item._id, updatedAtOf(item)]));
		},

		async syncMessages(params: AnySyncMessagesParams): Promise<SyncMessagesPage> {
			calls.push(params);
			const { roomId, type, count = 20, next, previous, lastUpdate } = params;
			const roomMessages = [...messages.values()].filter((item) => item.rid === roomId);
			const roomTrash = [...trash.values()].filter((item) => item.rid === roomId);

			if (lastUpdate) {
				const since = Date.parse(lastUpdate);
				return {
					updated: sortedBy(
						roomMessages.filter((item) => updatedAtOf(item) > since),
						(item) => item.ts.getTime(),
						-1,
					),
					deleted: roomTrash.filter((item) => deletedAtOf(item) > since),
				};
			}

			if (!type) throw new Error('The "type" or "lastUpdate" parameters must be provided');
			if (!next && !previous) {
				// No cursor and no lastUpdate: the server answers with channel history, which the route maps to empty lists.
				return { updated: [], deleted: [] };
			}

			if (type === 'UPDATED') {
				const { items, cursor } = page(roomMessages, updatedAtOf, count, next, previous);
				return { updated: items, deleted: [], cursor };
			}

			const { items, cursor } = page(roomTrash, deletedAtOf, count, next, previous);
			return { updated: [], deleted: items, cursor };
		},
	};
};

export type SyncMessagesServerMock = ReturnType<typeof createSyncMessagesServerMock>;
