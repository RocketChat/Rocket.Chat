import type { E2EESearchDoc, E2EESearchHit, E2EESearchRoomState, ISearchIndexBackend } from '@rocket.chat/desktop-api';

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

// The answer to an open with no wrap key. The desktop app gives the same.
const LOCKED_RESULT = { schemaVersion: 1, encryptedAtRest: false, locked: true } as const;

// The worker gets the wrap key as a non-extractable HKDF key. The bytes from the caller are cleared once imported.
const importWrapKey = async (wrapKey: Uint8Array | undefined): Promise<CryptoKey | undefined> => {
	if (wrapKey === undefined) return undefined;
	if (!(wrapKey instanceof Uint8Array) || wrapKey.length !== WRAP_KEY_BYTES) throw new Error('wrap key must be 32 bytes');
	try {
		return await crypto.subtle.importKey('raw', wrapKey as Uint8Array<ArrayBuffer>, 'HKDF', false, ['deriveKey']);
	} finally {
		wrapKey.fill(0);
	}
};

let persistRequested = false;

// Asks the browser once per page to keep the storage of the site under storage pressure, so the copy of the index is not
// evicted. Some browsers ask the user or wait a long time, so the index does not wait for the answer.
const requestPersistentStorage = (): void => {
	if (persistRequested) return;
	persistRequested = true;
	const storage = typeof navigator === 'undefined' ? undefined : navigator.storage;
	if (typeof storage?.persist !== 'function') {
		console.info('E2EE search index: this browser cannot keep its storage persistent');
		return;
	}
	// Firefox answers only after the user answers its prompt, so the request has its own line.
	console.info('E2EE search index: persistent storage requested');
	storage.persist().then(
		(granted) => console.info(`E2EE search index: persistent storage ${granted ? 'granted' : 'not granted'}`),
		(error: unknown) => console.warn('E2EE search index: persistent storage request failed:', error),
	);
};

const toHit = (row: SqlRow, tokens: string[]): E2EESearchHit => {
	const body = String(row.body);
	return {
		id: String(row.id),
		rid: String(row.rid),
		...(row.tmid !== null && { tmid: String(row.tmid) }),
		uid: String(row.uid),
		username: String(row.username),
		ts: Number(row.ts),
		snippet: tokens.length === 0 ? toFilterOnlySnippet(body) : toSnippet(body, tokens),
	};
};

/**
 * The E2EE search index of a browser: SQLite with full-text search, run by `runner` in a worker. It has the same
 * contract as the desktop index. Each server (`namespace`) and user has its own index. The runner keeps an encrypted
 * copy on disk when the browser can, so the index survives a reload. Like the desktop index, it opens only with the wrap
 * key that the web client derives from the E2EE private key: an open with no wrap key is `locked` and leaves the copy as
 * it is. An open with another wrap key than the one that sealed the copy comes after an E2EE key reset: like the desktop
 * index after a change of the public key, the copy is deleted and the index starts empty.
 */
export const createSqliteSearchIndexBackend = (runner: SqlRunner, { namespace }: { namespace: string }): ISearchIndexBackend => {
	let userId: string | undefined;

	const scopeIdOf = (id: string) => JSON.stringify([namespace, id]);

	const assertOpen = () => {
		if (userId === undefined) throw new Error('E2EE search index is not open');
	};

	return {
		async open(scope) {
			const { persistent, evicted, locked } = await runner.open(scopeIdOf(scope.userId), await importWrapKey(scope.wrapKey), SCHEMA);
			if (locked) {
				userId = undefined;
				return { ...LOCKED_RESULT };
			}
			if (persistent) requestPersistentStorage();
			// The index starts empty. Its room states are gone with it, so the crawler indexes every room again.
			if (evicted) console.warn('E2EE search index: the saved copy is gone, the index is built again');
			userId = scope.userId;
			return { schemaVersion: 1, encryptedAtRest: persistent };
		},

		async upsert(list: E2EESearchDoc[]) {
			assertOpen();
			await runner.batch(
				list.flatMap((doc) => [
					{ sql: 'DELETE FROM docs WHERE id = ?', bind: [doc.id] },
					{
						sql: 'INSERT INTO docs (id, rid, tmid, uid, username, ts, body, bytes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
						bind: [doc.id, doc.rid, doc.tmid ?? null, doc.uid, doc.username, doc.ts, doc.body, utf8Length(doc.body)],
					},
				]),
			);
		},

		async remove(ids) {
			assertOpen();
			await runner.batch(ids.map((id) => ({ sql: 'DELETE FROM docs WHERE id = ?', bind: [id] })));
		},

		async removeRoom(rid) {
			assertOpen();
			await runner.batch([
				{ sql: 'DELETE FROM docs WHERE rid = ?', bind: [rid] },
				{ sql: 'DELETE FROM room_state WHERE rid = ?', bind: [rid] },
			]);
		},

		async listRooms() {
			assertOpen();
			const rows = await runner.exec({ sql: 'SELECT rid FROM docs UNION SELECT rid FROM room_state ORDER BY rid' });
			return rows.map((row) => String(row.rid));
		},

		async search(query) {
			assertOpen();
			const tokens = queryTokens(query.text);
			// An empty text with filters lists the newest messages of the filters. No filter at all finds nothing.
			const filtered = query.rid !== undefined || query.uid !== undefined || query.from !== undefined || query.to !== undefined;
			const filtersOnly = query.text.trim() === '' && filtered;
			if (tokens.length === 0 && !filtersOnly) return [];

			const where: string[] = [];
			const bind: (string | number)[] = [];
			if (tokens.length > 0) {
				// Each token holds only letters, digits and marks, so a quoted prefix query is a plain word match.
				where.push('docs_fts MATCH ?');
				bind.push(tokens.map((token) => `"${token}"*`).join(' '));
			}
			if (query.rid !== undefined) {
				where.push('d.rid = ?');
				bind.push(query.rid);
			}
			if (query.uid !== undefined) {
				where.push('d.uid = ?');
				bind.push(query.uid);
			}
			if (query.from !== undefined) {
				where.push('d.ts >= ?');
				bind.push(query.from);
			}
			if (query.to !== undefined) {
				where.push('d.ts <= ?');
				bind.push(query.to);
			}
			bind.push(clampLimit(query.limit));

			const ranked = tokens.length > 0 && query.order !== 'recent';
			const sql =
				tokens.length > 0
					? `SELECT d.* FROM docs_fts JOIN docs d ON d.rowid = docs_fts.rowid WHERE ${where.join(' AND ')}
						ORDER BY ${ranked ? 'bm25(docs_fts), ' : ''}d.ts DESC LIMIT ?`
					: `SELECT d.* FROM docs d WHERE ${where.join(' AND ')} ORDER BY d.ts DESC LIMIT ?`;

			const rows = await runner.exec({ sql, bind });
			return rows.map((row) => toHit(row, tokens));
		},

		async getRoomState(rid) {
			assertOpen();
			const [row] = await runner.exec({ sql: 'SELECT state FROM room_state WHERE rid = ?', bind: [rid] });
			return row ? (JSON.parse(String(row.state)) as E2EESearchRoomState) : undefined;
		},

		async setRoomState(rid, state) {
			assertOpen();
			await runner.exec({
				sql: 'INSERT INTO room_state (rid, state) VALUES (?, ?) ON CONFLICT (rid) DO UPDATE SET state = excluded.state',
				bind: [rid, JSON.stringify(state)],
			});
		},

		async stats() {
			assertOpen();
			const [row] = await runner.exec({
				sql: 'SELECT count(*) AS docs, coalesce(sum(bytes), 0) AS bytes, count(DISTINCT rid) AS rooms FROM docs',
			});
			return { docs: Number(row.docs), bytes: Number(row.bytes), rooms: Number(row.rooms) };
		},

		async wipe(scope) {
			const target = userId ?? scope?.userId;
			userId = undefined;
			if (target !== undefined) await runner.wipe(scopeIdOf(target));
		},

		async close() {
			const target = userId;
			userId = undefined;
			if (target !== undefined) await runner.close(scopeIdOf(target));
		},
	};
};
