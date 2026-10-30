import { E2EE_SEARCH_LIMITS } from '@rocket.chat/desktop-api';
import type {
	E2EESearchDoc,
	E2EESearchHit,
	E2EESearchIndexEvent,
	E2EESearchQuery,
	E2EESearchRecentQuery,
	E2EESearchRoomState,
	ISearchIndexBackend,
} from '@rocket.chat/desktop-api';

import { clampLimit, queryTokens, toFilterOnlySnippet, toSnippet, utf8Length } from '../searchIndexText';
import type { SqlRow, SqlRunner } from './workerSqlRunner';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS docs (
	id TEXT PRIMARY KEY,
	rid TEXT NOT NULL,
	tmid TEXT,
	uid TEXT NOT NULL,
	username TEXT NOT NULL,
	ts INTEGER NOT NULL,
	body TEXT NOT NULL,
	bytes INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS docs_rid_ts ON docs (rid, ts);
CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts USING fts5 (
	body,
	content = 'docs',
	content_rowid = 'rowid',
	tokenize = 'unicode61 remove_diacritics 2'
);
CREATE TRIGGER IF NOT EXISTS docs_ai AFTER INSERT ON docs BEGIN
	INSERT INTO docs_fts (rowid, body) VALUES (new.rowid, new.body);
END;
CREATE TRIGGER IF NOT EXISTS docs_ad AFTER DELETE ON docs BEGIN
	INSERT INTO docs_fts (docs_fts, rowid, body) VALUES ('delete', old.rowid, old.body);
END;
CREATE TABLE IF NOT EXISTS room_state (rid TEXT PRIMARY KEY, state TEXT NOT NULL);
`;
const WRAP_KEY_BYTES = 32;
const LOCKED_RESULT = { schemaVersion: 1, encryptedAtRest: false, locked: true } as const;
const importWrapKey = async (wrapKey: Uint8Array | undefined): Promise<CryptoKey | undefined> => {
	if (wrapKey === undefined) return undefined;
	if (!(wrapKey instanceof Uint8Array) || wrapKey.length !== WRAP_KEY_BYTES) throw new Error('Wrap key must be 32 bytes');
	try {
		return await crypto.subtle.importKey('raw', wrapKey as Uint8Array<ArrayBuffer>, 'HKDF', false, ['deriveKey']);
	} finally {
		wrapKey.fill(0);
	}
};
let persistRequested = false;
const requestPersistentStorage = (): void => {
	if (persistRequested) return;
	persistRequested = true;
	const storage = typeof navigator === 'undefined' ? undefined : navigator.storage;
	if (typeof storage?.persist !== 'function') return;
	console.info('E2EE search index: persistent storage requested');
	void storage.persist().then(
		(granted) => console.info(`E2EE search index: persistent storage ${granted ? 'granted' : 'not granted'}`),
		(error: unknown) => console.warn('E2EE search index: persistent storage request failed:', error),
	);
};
const toHit = (row: SqlRow, tokens: string[]): E2EESearchHit => ({
	id: String(row.id),
	rid: String(row.rid),
	...(row.tmid !== null && { tmid: String(row.tmid) }),
	uid: String(row.uid),
	username: String(row.username),
	ts: Number(row.ts),
	snippet: tokens.length === 0 ? toFilterOnlySnippet(String(row.body)) : toSnippet(String(row.body), tokens),
});

export const createSqliteSearchIndexBackend = (runner: SqlRunner, { namespace }: { namespace: string }): ISearchIndexBackend => {
	let userId: string | undefined;
	let requestedUserId: string | undefined;
	let runnerScope: string | undefined;
	let session = 0;
	let checkpointEpoch = 0;
	let clearCheckpoints = false;
	let unsubscribe: (() => void) | undefined;
	let lost = false;
	const listeners = new Set<(event: E2EESearchIndexEvent) => void>();
	let queue: Promise<unknown> = Promise.resolve();
	const enqueue = <T>(run: () => Promise<T>): Promise<T> => {
		const result = queue.then(run);
		queue = result.catch(() => undefined);
		return result;
	};
	const scopeIdOf = (id: string) => JSON.stringify([namespace, id]);
	const emit = (event: E2EESearchIndexEvent) => {
		for (const listener of listeners) {
			try {
				listener(event);
			} catch (error) {
				console.warn('E2EE search index event listener failed:', error);
			}
		}
	};
	const endSession = () => {
		session++;
		unsubscribe?.();
		unsubscribe = undefined;
		listeners.clear();
		lost = false;
		clearCheckpoints = false;
		checkpointEpoch++;
	};
	const resetCheckpoints = async () => {
		if (!clearCheckpoints) return;
		const epoch = checkpointEpoch;
		await runner.exec({ sql: 'DELETE FROM room_state' });
		if (epoch === checkpointEpoch) clearCheckpoints = false;
	};
	const active = <T>(run: () => Promise<T>): Promise<T> => {
		const current = session;
		return enqueue(async () => {
			if (current !== session || userId === undefined) throw new Error('E2EE search index is not open');
			await resetCheckpoints();
			if (current !== session) throw new Error('E2EE search index is not open');
			return run();
		});
	};
	const changed = (current: number) => {
		if (current === session) emit({ type: 'changed' });
	};
	const searchRows = async (query: E2EESearchQuery | E2EESearchRecentQuery, paged: boolean) => {
		const cursor = 'cursor' in query ? query.cursor : undefined;
		if (cursor !== undefined && (!cursor || !Number.isFinite(cursor.ts) || typeof cursor.id !== 'string' || cursor.id.length === 0)) {
			throw new Error('Invalid recent search cursor');
		}
		const tokens = queryTokens(query.text);
		const filtered = query.rid !== undefined || query.uid !== undefined || query.from !== undefined || query.to !== undefined;
		if (tokens.length === 0 && !(query.text.trim() === '' && filtered)) return { rows: [], tokens };
		const where: string[] = [];
		const bind: (string | number)[] = [];
		if (tokens.length > 0) {
			where.push('docs_fts MATCH ?');
			bind.push(tokens.map((token) => `"${token}"*`).join(' '));
		}
		for (const [field, column, operator] of [
			['rid', 'rid', '='],
			['uid', 'uid', '='],
			['from', 'ts', '>='],
			['to', 'ts', '<='],
		] as const) {
			const value = query[field];
			if (value !== undefined) {
				where.push(`d.${column} ${operator} ?`);
				bind.push(value);
			}
		}
		if (paged && cursor) {
			where.push('(d.ts < ? OR (d.ts = ? AND d.id COLLATE BINARY < ?))');
			bind.push(cursor.ts, cursor.ts, cursor.id);
		}
		bind.push(clampLimit(query.limit) + (paged ? 1 : 0));
		const ranked = !paged && tokens.length > 0 && (!('order' in query) || query.order !== 'recent');
		const from = tokens.length > 0 ? 'docs_fts JOIN docs d ON d.rowid = docs_fts.rowid' : 'docs d';
		const order = `${ranked ? 'bm25(docs_fts), ' : ''}d.ts DESC${paged ? ', d.id COLLATE BINARY DESC' : ''}`;
		const rows = await runner.exec({ sql: `SELECT d.* FROM ${from} WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ?`, bind });
		return { rows, tokens };
	};
	return {
		open(scope) {
			const targetUserId = scope.userId;
			const wrapKey = scope.wrapKey?.slice();
			scope.wrapKey?.fill(0);
			const key = importWrapKey(wrapKey);
			void key.catch(() => undefined);
			endSession();
			const current = session;
			requestedUserId = targetUserId;
			userId = undefined;
			return enqueue(async () => {
				const state = await runner.open(scopeIdOf(targetUserId), await key, SCHEMA);
				runnerScope = scopeIdOf(targetUserId);
				if (current !== session) throw new Error('E2EE search index is closed');
				if (state.locked) return { ...LOCKED_RESULT };
				userId = targetUserId;
				lost = Boolean(state.evicted);
				if (lost) console.warn('E2EE search index: the saved copy is gone, the index is built again');
				if (state.persistent) requestPersistentStorage();
				unsubscribe = runner.onIndexEvent?.((event) => {
					if (current !== session || event.scopeId !== scopeIdOf(targetUserId)) return;
					if (event.type === 'lost') {
						lost = true;
						clearCheckpoints = true;
						checkpointEpoch++;
						const invalidated = enqueue(async () => {
							if (current === session) await resetCheckpoints();
						});
						emit({ type: 'lost' });
						void invalidated.catch((error: unknown) => console.warn('E2EE search checkpoint invalidation failed:', error));
					} else emit({ type: 'changed' });
				});
				return {
					schemaVersion: 1,
					encryptedAtRest: state.persistent,
					...(runner.onIndexEvent && { capabilities: { recentCursor: 1, lifecycleEvents: 1, close: 1 } as const }),
				};
			});
		},
		onIndexEvent(listener) {
			if (userId === undefined) throw new Error('E2EE search index is not open');
			listeners.add(listener);
			if (lost) listener({ type: 'lost' });
			return () => {
				listeners.delete(listener);
			};
		},
		upsert(list: E2EESearchDoc[]) {
			const current = session;
			return active(async () => {
				if (list.length > E2EE_SEARCH_LIMITS.maxBatchDocuments) throw new Error('Too many search documents');
				let bodyLength = 0;
				for (const doc of list) {
					if (doc.body.length > E2EE_SEARCH_LIMITS.maxDocumentBodyCodeUnits) throw new Error('Search document body is too long');
					bodyLength += doc.body.length;
				}
				if (bodyLength > E2EE_SEARCH_LIMITS.maxBatchBodyCodeUnits) throw new Error('Search batch body is too long');
				await runner.batch(
					list.flatMap((doc) => [
						{ sql: 'DELETE FROM docs WHERE id = ?', bind: [doc.id] },
						{
							sql: 'INSERT INTO docs (id, rid, tmid, uid, username, ts, body, bytes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
							bind: [doc.id, doc.rid, doc.tmid ?? null, doc.uid, doc.username, doc.ts, doc.body, utf8Length(doc.body)],
						},
					]),
				);
				await runner.flush();
				changed(current);
			});
		},
		remove(ids) {
			const current = session;
			return active(async () => {
				await runner.batch(ids.map((id) => ({ sql: 'DELETE FROM docs WHERE id = ?', bind: [id] })));
				await runner.flush();
				changed(current);
			});
		},
		removeRoom(rid) {
			const current = session;
			return active(async () => {
				await runner.batch([
					{ sql: 'DELETE FROM docs WHERE rid = ?', bind: [rid] },
					{ sql: 'DELETE FROM room_state WHERE rid = ?', bind: [rid] },
				]);
				await runner.flush();
				changed(current);
			});
		},
		listRooms: () =>
			active(async () =>
				(await runner.exec({ sql: 'SELECT rid FROM docs UNION SELECT rid FROM room_state ORDER BY rid' })).map((row) => String(row.rid)),
			),
		search: (query) =>
			active(async () => {
				const { rows, tokens } = await searchRows(query, false);
				return rows.map((row) => toHit(row, tokens));
			}),
		searchRecentPage: (query) =>
			active(async () => {
				const { rows, tokens } = await searchRows(query, true);
				const hits = rows.slice(0, clampLimit(query.limit)).map((row) => toHit(row, tokens));
				const last = hits.at(-1);
				return { hits, ...(rows.length > hits.length && last && { nextCursor: { ts: last.ts, id: last.id } }) };
			}),
		getRoomState: (rid) =>
			active(async () => {
				const [row] = await runner.exec({ sql: 'SELECT state FROM room_state WHERE rid = ?', bind: [rid] });
				return row ? (JSON.parse(String(row.state)) as E2EESearchRoomState) : undefined;
			}),
		setRoomState(rid, state) {
			const epoch = checkpointEpoch;
			const savedState = JSON.stringify(state);
			return active(async () => {
				if (epoch !== checkpointEpoch) throw new Error('E2EE search index checkpoints were invalidated');
				await runner.exec({
					sql: 'INSERT INTO room_state (rid, state) VALUES (?, ?) ON CONFLICT (rid) DO UPDATE SET state = excluded.state',
					bind: [rid, savedState],
				});
				await runner.flush();
			});
		},
		stats: () =>
			active(async () => {
				const [row] = await runner.exec({
					sql: 'SELECT count(*) AS docs, coalesce(sum(bytes), 0) AS bytes, count(DISTINCT rid) AS rooms FROM docs',
				});
				return { docs: Number(row.docs), bytes: Number(row.bytes), rooms: Number(row.rooms) };
			}),
		wipe(scope) {
			const target = scope?.userId ?? userId ?? requestedUserId;
			endSession();
			userId = undefined;
			requestedUserId = undefined;
			return enqueue(async () => {
				if (target !== undefined) await runner.wipe(scopeIdOf(target));
			});
		},
		close() {
			const target = userId ?? requestedUserId;
			endSession();
			userId = undefined;
			requestedUserId = undefined;
			return enqueue(async () => {
				const scopeId = target === undefined ? runnerScope : scopeIdOf(target);
				if (scopeId !== undefined) await runner.close(scopeId);
				runnerScope = undefined;
			});
		},
	};
};
