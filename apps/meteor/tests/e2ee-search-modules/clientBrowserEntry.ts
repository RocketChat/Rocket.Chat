import type { IMessage } from '@rocket.chat/core-typings';

import { createSqliteSearchIndexBackend } from '../../client/lib/e2eeSearch/browser/sqliteSearchIndexBackend';
import { createWorkerSqlRunner } from '../../client/lib/e2eeSearch/browser/workerSqlRunner';
import { createSearchIndexCrawler } from '../../client/lib/e2eeSearch/searchIndexCrawler';
import { createSearchIndexSession } from '../../client/lib/e2eeSearch/searchIndexSession';
import { createSearchIndexSessionBackend } from '../../client/lib/e2eeSearch/searchIndexSessionBackend';
import { createSearchIndexWriter } from '../../client/lib/e2eeSearch/searchIndexWriter';
import { searchLocalIndex } from '../../client/lib/e2eeSearch/searchLocalIndex';

const message = (id: string, msg = 'needle', updatedAt = 1000): IMessage =>
	({
		_id: id,
		rid: 'room',
		t: 'e2e',
		e2e: 'done',
		msg,
		u: { _id: 'alice', username: 'alice' },
		ts: new Date(1000),
		_updatedAt: new Date(updatedAt),
	}) as IMessage;

const run = async () => {
	const runner = createWorkerSqlRunner('/workers/e2ee-search/worker.mjs');
	const raw = createSqliteSearchIndexBackend(runner, { namespace: 'client-modules-live' });
	const openResult = await raw.open({ userId: 'user', wrapKey: new Uint8Array(32).fill(9) });
	const first = createSearchIndexSessionBackend(raw);
	let active = first.backend;
	const writer = createSearchIndexWriter({ getBackend: () => active });
	const ids = [...Array.from({ length: 203 }, (_, n) => `m${String(n).padStart(3, '0')}`), '', '\u{10000}'];
	try {
		for (const id of ids) writer.index(message(id));
		await writer.flush({ throwOnError: true });
		const query = () => searchLocalIndex(active, { openResult, searchText: 'needle', rid: 'room', limit: 300 });
		const before = (await query()).map(({ id }) => id);
		await active.setRoomState('room', { backfillDone: true, lastUpdate: 1000 });
		const calls: { type: string; next?: string }[] = [];
		const crawler = createSearchIndexCrawler({
			backend: active,
			writer,
			now: () => 4000,
			syncMessages: async (params) => {
				calls.push({ type: params.type, next: params.next });
				return {
					updated:
						params.type === 'UPDATED'
							? [
									{ ...message('m000', '', 2000), t: 'rm', _hidden: true } as IMessage,
									message('m001', '', 2500),
									{ ...message('new', 'needle new', 3000), e2e: 'pending' } as IMessage,
								]
							: [],
					deleted: params.type === 'DELETED' ? [{ _id: 'm002', _deletedAt: new Date(3500) }] : [],
					cursor: { next: null, previous: null },
				};
			},
			decryptMessage: async (encrypted) => {
				const decrypted = { ...encrypted, e2e: 'done' } as IMessage;
				writer.index(decrypted);
				return decrypted;
			},
		});
		for (let count = 0; count < 4; count++) {
			if ((await crawler.catchUpRoomPage('room')).done) break;
			if (count === 3) throw new Error('Catch-up did not finish');
		}
		const after = (await query()).map(({ id }) => id);
		const state = await active.getRoomState('room');
		const lateWrite = writer.bindToOpenIndex();
		first.revoke();
		const second = createSearchIndexSessionBackend(raw);
		active = second.backend;
		lateWrite(message('stale', 'needle old session'));
		writer.index(message('current', 'needle current session'));
		await writer.flush({ throwOnError: true });
		const sessions = (await query()).map(({ id }) => id);
		await runner.flush();
		await active.close!();
		await raw.open({ userId: 'user', wrapKey: new Uint8Array(32).fill(9) });
		active = createSearchIndexSessionBackend(raw).backend;
		const restored = (await query()).map(({ id }) => id);
		await raw.wipe();
		return { before, after, state, calls, sessions, restored };
	} finally {
		writer.dispose();
		await raw.close?.();
	}
};

const runSessionLifecycle = async () => {
	const runner = createWorkerSqlRunner('/workers/e2ee-search/worker.mjs');
	const raw = createSqliteSearchIndexBackend(runner, { namespace: 'client-session-live' });
	const keys = await crypto.subtle.generateKey(
		{ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
		true,
		['encrypt', 'decrypt'],
	);
	let userId: string | undefined = 'user';
	let allowed = true;
	let listener: ((change: { prevState: string; nextState: string }) => void) | undefined;
	const errors: string[] = [];
	const session = createSearchIndexSession(
		{
			on: (_event, handler) => {
				listener = handler;
				return () => {
					listener = undefined;
				};
			},
			getUserId: () => userId,
			getPrivateKey: () => keys.privateKey,
		},
		{ getBackend: () => raw, isAllowed: () => allowed, onError: (error) => errors.push(String(error)) },
	);
	const writer = createSearchIndexWriter({ getBackend: () => session.getActiveBackend() });
	const state = async (nextState: string) => {
		listener?.({ prevState: '', nextState });
		await session.whenSettled();
	};
	try {
		await state('READY');
		const first = session.getActiveBackend()!;
		const late = writer.bindToOpenIndex();
		writer.index(message('kept', 'lifecycle needle'));
		await writer.flush({ throwOnError: true });
		await runner.flush();
		userId = undefined;
		await state('NOT_STARTED');
		let revoked = false;
		try {
			await first.stats();
		} catch {
			revoked = true;
		}
		late(message('stale', 'lifecycle needle'));
		userId = 'user';
		await state('READY');
		await writer.flush({ throwOnError: true });
		const restored = await session.getActiveBackend()!.search({ text: 'lifecycle' });
		allowed = false;
		session.recheck();
		await session.whenSettled();
		const inactive = session.getActiveBackend() === undefined;
		allowed = true;
		session.recheck();
		await session.whenSettled();
		const empty = await session.getActiveBackend()!.stats();
		await session.wipeClosed();
		return { revoked, restored: restored.map(({ id }) => id), inactive, docsAfterOptOut: empty.docs, errors };
	} finally {
		writer.dispose();
		session.dispose();
		await session.whenSettled();
		await raw.close?.();
	}
};

Object.assign(window, { e2eeSearchClientTest: { run, runSessionLifecycle } });

export type ClientBrowserWindow = Window & { e2eeSearchClientTest: { run: typeof run; runSessionLifecycle: typeof runSessionLifecycle } };
