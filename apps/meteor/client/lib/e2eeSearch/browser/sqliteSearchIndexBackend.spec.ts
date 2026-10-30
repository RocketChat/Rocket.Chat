import { E2EE_SEARCH_LIMITS } from '@rocket.chat/desktop-api';
import type { E2EESearchDoc, E2EESearchIndexEvent } from '@rocket.chat/desktop-api';

import { createSqliteSearchIndexBackend } from './sqliteSearchIndexBackend';
import type { SqlIndexEvent, SqlRunner } from './workerSqlRunner';

const document = (body = 'needle'): E2EESearchDoc => ({
	id: 'a',
	rid: 'r',
	uid: 'u',
	username: 'user',
	ts: 10,
	updatedAt: 10,
	kind: 'text',
	body,
});
const setup = (events = true) => {
	const callbacks: ((event: SqlIndexEvent) => void)[] = [];
	const runner = {
		open: jest.fn<ReturnType<SqlRunner['open']>, Parameters<SqlRunner['open']>>(async () => ({ persistent: false, restored: false })),
		exec: jest.fn<ReturnType<SqlRunner['exec']>, Parameters<SqlRunner['exec']>>(async () => []),
		batch: jest.fn(async () => undefined),
		flush: jest.fn<ReturnType<SqlRunner['flush']>, Parameters<SqlRunner['flush']>>(async () => undefined),
		wipe: jest.fn<ReturnType<SqlRunner['wipe']>, Parameters<SqlRunner['wipe']>>(async () => undefined),
		close: jest.fn(async () => undefined),
		...(events && {
			onIndexEvent: (listener: (event: SqlIndexEvent) => void) => {
				callbacks.push(listener);
				return jest.fn();
			},
		}),
	};
	const backend = createSqliteSearchIndexBackend(runner, { namespace: 'n' });
	return { runner, backend, callbacks, open: () => backend.open({ userId: 'u', wrapKey: new Uint8Array(32).fill(1) }) };
};

describe('SQLite search backend B1 additions', () => {
	it('announces capabilities only with runner lifecycle events', async () => {
		await expect(setup().open()).resolves.toHaveProperty('capabilities', { recentCursor: 1, lifecycleEvents: 1, close: 1 });
		await expect(setup(false).open()).resolves.not.toHaveProperty('capabilities');
	});
	it('keeps a locked open free of schema writes and rejects reads and writes', async () => {
		const { backend, runner } = setup();
		runner.open.mockResolvedValue({ persistent: false, restored: false, locked: true });
		await expect(backend.open({ userId: 'u' })).resolves.toEqual({ schemaVersion: 1, encryptedAtRest: false, locked: true });
		await expect(backend.searchRecentPage!({ text: 'needle' })).rejects.toThrow('not open');
		await expect(backend.upsert([document()])).rejects.toThrow('not open');
		expect(runner.exec).not.toHaveBeenCalled();
		expect(runner.batch).not.toHaveBeenCalled();
	});
	it('uses exclusive compound continuation, binary ordering, every filter, and one lookahead', async () => {
		const { backend, runner, open } = setup();
		await open();
		runner.exec.mockResolvedValue(['z', 'y', 'x'].map((id) => ({ ...document(), id, tmid: null })));
		const page = await backend.searchRecentPage!({
			text: 'needle',
			rid: 'r',
			uid: 'u',
			from: 1,
			to: 20,
			cursor: { ts: 10, id: 'zz' },
			limit: 2,
		});
		expect(page.hits.map((hit) => hit.id)).toEqual(['z', 'y']);
		expect(page.nextCursor).toEqual({ ts: 10, id: 'y' });
		const [statement] = runner.exec.mock.calls.at(-1)!;
		expect(statement.sql).toContain('(d.ts < ? OR (d.ts = ? AND d.id COLLATE BINARY < ?))');
		expect(statement.sql).toContain('ORDER BY d.ts DESC, d.id COLLATE BINARY DESC');
		expect(statement.bind).toEqual(['"needle"*', 'r', 'u', 1, 20, 10, 10, 'zz', 3]);
		runner.exec.mockResolvedValue([{ ...document(), tmid: null }]);
		await expect(backend.searchRecentPage!({ text: '', rid: 'different', limit: 1000 })).resolves.not.toHaveProperty('nextCursor');
		expect(runner.exec.mock.calls.at(-1)![0].bind).toEqual(['different', E2EE_SEARCH_LIMITS.maxResults + 1]);
		await expect(backend.searchRecentPage!({ text: '' })).resolves.toEqual({ hits: [] });
	});
	it.each([{ ts: NaN, id: 'a' }, { ts: Infinity, id: 'a' }, { ts: 10, id: '' }, null])('rejects invalid cursor %j', async (cursor) => {
		const { backend, open } = setup();
		await open();
		await expect(backend.searchRecentPage!({ text: 'needle', cursor: cursor as never })).rejects.toThrow('Invalid recent search cursor');
	});
	it('preserves legacy relevance and default result limits', async () => {
		const { backend, runner, open } = setup();
		await open();
		await backend.search({ text: 'needle' });
		expect(runner.exec.mock.calls.at(-1)![0].sql).toContain('ORDER BY bm25(docs_fts), d.ts DESC LIMIT ?');
		expect(runner.exec.mock.calls.at(-1)![0].bind).toEqual(['"needle"*', E2EE_SEARCH_LIMITS.defaultResults]);
	});
	it('enforces all shared upsert limits before starting a transaction', async () => {
		const { backend, runner, open } = setup();
		await open();
		await expect(backend.upsert(Array.from({ length: 501 }, () => document()))).rejects.toThrow('Too many');
		await expect(backend.upsert([document('x'.repeat(65537))])).rejects.toThrow('document body');
		await expect(backend.upsert(Array.from({ length: 33 }, () => document('x'.repeat(65536))))).rejects.toThrow('batch body');
		expect(runner.batch).not.toHaveBeenCalled();
		await backend.upsert([document('x'.repeat(65536))]);
		expect(runner.batch).toHaveBeenCalledTimes(1);
	});
	it.each(['upsert', 'remove', 'removeRoom', 'setRoomState'] as const)('persists %s before acknowledging it', async (method) => {
		const { backend, runner, open } = setup();
		await open();
		let saved!: () => void;
		runner.flush.mockImplementationOnce(
			() =>
				new Promise<void>((resolve) => {
					saved = resolve;
				}),
		);
		const write = () => {
			switch (method) {
				case 'upsert':
					return backend.upsert([document()]);
				case 'remove':
					return backend.remove(['a']);
				case 'removeRoom':
					return backend.removeRoom('r');
				case 'setRoomState':
					return backend.setRoomState('r', { backfillDone: true });
			}
		};
		let acknowledged = false;
		const writing = write().then(() => {
			acknowledged = true;
		});
		await new Promise((resolve) => setTimeout(resolve, 0));
		expect(runner.flush).toHaveBeenCalledTimes(1);
		expect(acknowledged).toBe(false);
		saved();
		await writing;
		expect(acknowledged).toBe(true);
		runner.flush.mockRejectedValueOnce(new Error('snapshot save failed'));
		await expect(write()).rejects.toThrow('snapshot save failed');
	});
	it('invalidates checkpoints on loss and ignores callbacks from an old session', async () => {
		const { backend, runner, callbacks, open } = setup();
		await open();
		const old = jest.fn();
		backend.onIndexEvent!(old);
		callbacks[0]({ scopeId: '["n","u"]', type: 'lost' });
		await backend.getRoomState('r');
		expect(runner.exec).toHaveBeenCalledWith({ sql: 'DELETE FROM room_state' });
		expect(old).toHaveBeenCalledWith({ type: 'lost' });
		await backend.close!();
		await open();
		const next = jest.fn();
		const unsubscribe = backend.onIndexEvent!(next);
		callbacks[0]({ scopeId: '["n","u"]', type: 'lost' });
		callbacks[1]({ scopeId: '["n","other"]', type: 'changed' });
		await backend.search({ text: '' });
		expect(next).not.toHaveBeenCalled();
		callbacks[1]({ scopeId: '["n","u"]', type: 'changed' });
		expect(next).toHaveBeenCalledTimes(1);
		unsubscribe();
		callbacks[1]({ scopeId: '["n","u"]', type: 'changed' });
		expect(next).toHaveBeenCalledTimes(1);
		expect(old).toHaveBeenCalledTimes(1);
	});
	it('reports loss found during open to a listener registered after open', async () => {
		const { backend, runner, open } = setup();
		runner.open.mockResolvedValue({ persistent: true, restored: false, evicted: true });
		await open();
		const events: E2EESearchIndexEvent[] = [];
		backend.onIndexEvent!((event) => events.push(event));
		expect(events).toEqual([{ type: 'lost' }]);
	});
	it('captures the user and wrap key before queued open work starts', async () => {
		const { backend, runner } = setup();
		const scope = { userId: 'original', wrapKey: new Uint8Array(32).fill(1) };
		const opening = backend.open(scope);
		expect(scope.wrapKey.every((byte) => byte === 0)).toBe(true);
		scope.userId = 'mutated';
		scope.wrapKey.fill(9);
		await opening;
		expect(runner.open.mock.calls[0][0]).toBe('["n","original"]');
		const actual = runner.open.mock.calls[0][1]!;
		const expected = await crypto.subtle.importKey('raw', new Uint8Array(32).fill(1), 'HKDF', false, ['deriveKey']);
		const sign = async (key: CryptoKey) => {
			const derived = await crypto.subtle.deriveKey(
				{ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: new Uint8Array(0) },
				key,
				{ name: 'HMAC', hash: 'SHA-256', length: 256 },
				false,
				['sign'],
			);
			return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', derived, new Uint8Array([1]))));
		};
		expect(await sign(actual)).toEqual(await sign(expected));
	});
	it('wipes the requested scope when open is still pending', async () => {
		const { backend, runner, open } = setup();
		let finish!: () => void;
		runner.open.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					finish = () => resolve({ persistent: false, restored: false });
				}),
		);
		const opening = open();
		const outcome = expect(opening).rejects.toThrow('closed');
		await new Promise((resolve) => setTimeout(resolve, 0));
		const wiped = backend.wipe();
		finish();
		await outcome;
		await wiped;
		expect(runner.wipe).toHaveBeenCalledWith('["n","u"]');
		await expect(backend.search({ text: 'needle' })).rejects.toThrow('not open');
	});
	it.each([false, true])('wipes the explicit user instead of the retained user when locked is %s', async (locked) => {
		const { backend, runner } = setup();
		const previousScope = '["n","u1"]';
		const targetScope = '["n","u2"]';
		const savedScopes = new Set([previousScope, targetScope]);
		runner.open.mockResolvedValueOnce({ persistent: false, restored: false, ...(locked && { locked: true }) });
		runner.wipe.mockImplementation(async (scopeId) => {
			savedScopes.delete(scopeId);
		});
		const state = await backend.open({ userId: 'u1' });
		expect(state.locked).toBe(locked ? true : undefined);

		await backend.wipe({ userId: 'u2' });

		expect(runner.wipe.mock.calls).toEqual([[targetScope]]);
		expect(savedScopes).toEqual(new Set([previousScope]));
		await expect(backend.search({ text: 'needle' })).rejects.toThrow('not open');
		await backend.close!();
		expect(runner.close.mock.calls).toEqual([[previousScope]]);

		await backend.open({ userId: 'u2' });
		await backend.upsert([document()]);
		await backend.close!();
		expect(runner.open.mock.calls.map(([scopeId]) => scopeId)).toEqual([previousScope, targetScope]);
		expect(runner.batch).toHaveBeenCalledTimes(1);
		expect(runner.close.mock.calls).toEqual([[previousScope], [targetScope]]);
		expect(runner.wipe).toHaveBeenCalledTimes(1);
		expect(savedScopes).toEqual(new Set([previousScope]));
	});
	it('rejects a checkpoint queued before loss and resets state before the next read', async () => {
		const { backend, runner, callbacks, open } = setup();
		await open();
		const checkpoint = backend.setRoomState('r', { backfillDone: true });
		callbacks[0]({ scopeId: '["n","u"]', type: 'lost' });
		await expect(checkpoint).rejects.toThrow('checkpoints were invalidated');
		await expect(backend.getRoomState('r')).resolves.toBeUndefined();
		expect(runner.exec.mock.calls.map(([statement]) => statement.sql)).toEqual([
			'DELETE FROM room_state',
			'SELECT state FROM room_state WHERE rid = ?',
		]);
	});
	it('clears an in-flight checkpoint after loss before a queued read', async () => {
		const { backend, runner, callbacks, open } = setup();
		await open();
		runner.exec.mockImplementationOnce(async () => {
			callbacks[0]({ scopeId: '["n","u"]', type: 'lost' });
			return [];
		});
		const checkpoint = backend.setRoomState('r', { backfillDone: true });
		const read = backend.getRoomState('r');
		await checkpoint;
		await read;
		expect(runner.exec.mock.calls.map(([statement]) => statement.sql)).toEqual([
			'INSERT INTO room_state (rid, state) VALUES (?, ?) ON CONFLICT (rid) DO UPDATE SET state = excluded.state',
			'DELETE FROM room_state',
			'SELECT state FROM room_state WHERE rid = ?',
		]);
	});

	it('does not run queued old-session writes after a replacement open', async () => {
		const { backend, runner, open } = setup();
		await open();
		const oldWrite = backend.upsert([document()]);
		const replacement = open();
		await expect(oldWrite).rejects.toThrow('not open');
		await replacement;
		expect(runner.batch).not.toHaveBeenCalled();
	});
});
