import type { E2EESearchDoc, E2EESearchRoomState, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { createSqliteSearchIndexBackend } from '../../client/lib/e2eeSearch/browser/sqliteSearchIndexBackend';
import { createWorkerSqlRunner, type SqlRunner } from '../../client/lib/e2eeSearch/browser/workerSqlRunner';

const LEGACY_SCHEMA = `
CREATE TABLE docs (
	id TEXT PRIMARY KEY, rid TEXT NOT NULL, tmid TEXT, uid TEXT NOT NULL,
	username TEXT NOT NULL, ts INTEGER NOT NULL, body TEXT NOT NULL, bytes INTEGER NOT NULL
);
CREATE INDEX docs_rid_ts ON docs (rid, ts);
CREATE VIRTUAL TABLE docs_fts USING fts5 (
	body, content = 'docs', content_rowid = 'rowid', tokenize = 'unicode61 remove_diacritics 2'
);
CREATE TRIGGER docs_ai AFTER INSERT ON docs BEGIN
	INSERT INTO docs_fts (rowid, body) VALUES (new.rowid, new.body);
END;
CREATE TRIGGER docs_ad AFTER DELETE ON docs BEGIN
	INSERT INTO docs_fts (docs_fts, rowid, body) VALUES ('delete', old.rowid, old.body);
END;
CREATE TABLE room_state (rid TEXT PRIMARY KEY, state TEXT NOT NULL);
`;

const entries: { backend: ISearchIndexBackend; runner: SqlRunner; namespace: string; rejectBatch?: number }[] = [];

const api = {
	create(namespace: string) {
		const runner = createWorkerSqlRunner('/workers/e2ee-search/worker.mjs');
		const id = entries.length;
		const backend = createSqliteSearchIndexBackend(
			{
				...runner,
				batch: async (statements) => {
					const entry = entries[id];
					if (entry.rejectBatch !== undefined && --entry.rejectBatch === 0) {
						entry.rejectBatch = undefined;
						throw new Error('Test migration batch failure');
					}
					await runner.batch(statements);
				},
			},
			{ namespace },
		);
		entries.push({ backend, runner, namespace });
		return id;
	},
	async seedLegacy(id: number, docs: E2EESearchDoc[], checkpoint: E2EESearchRoomState) {
		const { runner, namespace } = entries[id];
		const scope = JSON.stringify([namespace, 'u']);
		const key = await crypto.subtle.importKey('raw', new Uint8Array(32).fill(7), 'HKDF', false, ['deriveKey']);
		const state = await runner.open(scope, key, LEGACY_SCHEMA);
		await runner.batch([
			...docs.map((doc) => ({
				sql: 'INSERT INTO docs (id, rid, tmid, uid, username, ts, body, bytes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
				bind: [doc.id, doc.rid, doc.tmid ?? null, doc.uid, doc.username, doc.ts, doc.body, new TextEncoder().encode(doc.body).length],
			})),
			{ sql: 'INSERT INTO room_state (rid, state) VALUES (?, ?)', bind: ['r', JSON.stringify(checkpoint)] },
		]);
		await runner.flush();
		await runner.close(scope);
		return state;
	},
	call(id: number, method: keyof ISearchIndexBackend, args: unknown[]) {
		return (entries[id].backend[method] as (...list: unknown[]) => Promise<unknown>)(...args);
	},
	exec(id: number, sql: string) {
		return entries[id].runner.exec({ sql });
	},
	rejectMigrationBatch(id: number, batch: number) {
		entries[id].rejectBatch = batch;
	},
};

Object.assign(window, { e2eeSearchUnicodeTest: api });
export type UnicodeTestWindow = Window & { e2eeSearchUnicodeTest: typeof api };
