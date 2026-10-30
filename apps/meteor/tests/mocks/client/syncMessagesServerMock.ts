import { Buffer } from 'node:buffer';

import type { IMessage } from '@rocket.chat/core-typings';

import type { SyncMessagesPage } from '../../../client/lib/e2eeSearch/searchIndexCrawler';

type Trashed = { _id: string; rid: string; _deletedAt: Date };

export type AnySyncMessagesParams = {
	roomId: string;
	type?: 'UPDATED' | 'DELETED';
	count?: number;
	next?: string;
	previous?: string;
	lastUpdate?: string;
};

/** Simulate compound and legacy cursors with a controllable server clock. */
export const createSyncMessagesServerMock = ({ startAt, compoundCursors = true }: { startAt: number; compoundCursors?: boolean }) => {
	let clock = startAt;
	const messages = new Map<string, IMessage>();
	const trash = new Map<string, Trashed>();
	const calls: AnySyncMessagesParams[] = [];
	const tick = () => ++clock;
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
	const parseCursor = (cursor: string): { at: number; id?: string } => {
		const separator = compoundCursors ? cursor.indexOf('_') : -1;
		const at = parseInt(separator === -1 ? cursor : cursor.slice(0, separator), 10);
		if (Number.isNaN(at)) throw new Error('Invalid cursor timestamp');
		return separator === -1 ? { at } : { at, id: cursor.slice(separator + 1) };
	};
	const compareIds = (a: string, b: string) => Buffer.compare(Buffer.from(a), Buffer.from(b));
	const page = <T extends { _id: string }>(items: T[], key: (item: T) => number, count: number, next?: string, previous?: string) => {
		const { at, id } = parseCursor((previous ?? next) as string);
		const direction = previous ? -1 : 1;
		const afterCursor = (item: T) => {
			const byTime = (key(item) - at) * direction;
			if (id === undefined || byTime !== 0) return byTime > 0;
			return compareIds(item._id, id) * direction > 0;
		};
		const selected =
			id === undefined
				? sortedBy(items.filter(afterCursor), key, direction)
				: items.filter(afterCursor).sort((a, b) => (key(a) - key(b)) * direction || compareIds(a._id, b._id) * direction);
		const response = selected.slice(0, count + 1);
		const cursorOf = (item: T | undefined) => {
			if (item === undefined) return null;
			return id === undefined ? `${key(item)}` : `${key(item)}_${item._id}`;
		};
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
		advance(ms: number) {
			clock += ms;
		},
		addHistory(id: string, rid: string, ts: number) {
			messages.set(id, message(id, rid, ts, ts));
		},
		send(id: string, rid: string) {
			const at = tick();
			messages.set(id, message(id, rid, at, at));
		},
		sendInSameMillisecond(id: string, rid: string) {
			messages.set(id, message(id, rid, clock, clock));
		},
		edit(id: string) {
			const current = messages.get(id);
			if (!current) throw new Error(`Message ${id} is missing`);
			messages.set(id, message(id, current.rid, current.ts.getTime(), tick()));
		},
		remove(id: string) {
			const current = messages.get(id);
			if (!current) throw new Error(`Message ${id} is missing`);
			messages.delete(id);
			trash.set(id, { _id: id, rid: current.rid, _deletedAt: new Date(tick()) });
		},
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
			if (!type) throw new Error('Supply type or lastUpdate');
			if (!next && !previous) return { updated: [], deleted: [] };
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
