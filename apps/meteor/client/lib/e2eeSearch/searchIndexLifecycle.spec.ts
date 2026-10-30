import type { IMessage } from '@rocket.chat/core-typings';
import type { E2EESearchOpenResult, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { createSearchIndexLifecycle } from './searchIndexLifecycle';
import { createSearchIndexSession } from './searchIndexSession';
import type { SearchIndexSessionSource } from './searchIndexSession';
import { createSearchIndexWriter } from './searchIndexWriter';
import { createMemorySearchIndexBackend } from '../../../tests/mocks/client/memorySearchIndexBackend';

const deferred = <T>() => {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((done) => {
		resolve = done;
	});
	return { promise, resolve };
};
const opened: E2EESearchOpenResult = {
	schemaVersion: 1,
	encryptedAtRest: true,
	capabilities: { recentCursor: 1, lifecycleEvents: 1, close: 1 },
};
let privateKey: CryptoKey;
beforeAll(async () => {
	privateKey = (
		await crypto.subtle.generateKey(
			{ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
			true,
			['encrypt', 'decrypt'],
		)
	).privateKey;
});
const message = (id: string): IMessage =>
	({ _id: id, rid: 'r1', t: 'e2e', e2e: 'done', msg: 'sealed message', u: { _id: 'u1', username: 'user' }, ts: new Date(100) }) as IMessage;

const setup = () => {
	const stores = new Map<string, ReturnType<typeof createMemorySearchIndexBackend>>();
	const storeFor = (userId: string) => {
		let store = stores.get(userId);
		if (!store) {
			store = createMemorySearchIndexBackend();
			stores.set(userId, store);
		}
		return store;
	};
	let openUser: string | undefined;
	const current = () => {
		if (!openUser) throw new Error('The test index is not open');
		return storeFor(openUser);
	};
	const memory = createMemorySearchIndexBackend();
	const raw: jest.Mocked<ISearchIndexBackend> = {
		...memory,
		open: jest.fn(async ({ userId }) => {
			openUser = userId;
			return opened;
		}),
		upsert: jest.fn(async (docs) => current().upsert(docs)),
		remove: jest.fn(async (ids) => current().remove(ids)),
		removeRoom: jest.fn(async (rid) => current().removeRoom(rid)),
		listRooms: jest.fn(async () => current().listRooms()),
		search: jest.fn(async (query) => current().search(query)),
		searchRecentPage: jest.fn(async () => ({ hits: [] })),
		onIndexEvent: jest.fn(() => () => undefined),
		getRoomState: jest.fn(async (rid) => current().getRoomState(rid)),
		setRoomState: jest.fn(async (rid, state) => current().setRoomState(rid, state)),
		stats: jest.fn(async () => current().stats()),
		close: jest.fn(async () => {
			openUser = undefined;
		}),
		wipe: jest.fn(async (scope) => {
			if (!scope) throw new Error('A test wipe requires a user scope');
			await storeFor(scope.userId).wipe(scope);
			if (openUser === scope.userId) openUser = undefined;
		}),
	};
	const state = { userId: 'u1' as string | undefined, key: privateKey as CryptoKey | undefined };
	let listener!: Parameters<SearchIndexSessionSource['on']>[1];
	const source: SearchIndexSessionSource = {
		on: (_type, handler) => {
			listener = handler;
			return () => undefined;
		},
		getUserId: () => state.userId,
		getPrivateKey: () => state.key,
	};
	let backend: ISearchIndexBackend | undefined = raw;
	const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => true });
	const writer = createSearchIndexWriter({ getBackend: session.getActiveBackend, delayMs: 60_000 });
	const stopIndexing = jest.fn(async (): Promise<void> => undefined);
	const lifecycle = createSearchIndexLifecycle({ session, source, writer, stopIndexing });
	const setState = (nextState: string) => listener({ prevState: '', nextState });
	const login = async () => {
		setState('READY');
		await session.whenSettled();
	};
	return {
		session,
		source,
		state,
		raw,
		writer,
		lifecycle,
		stopIndexing,
		setState,
		login,
		storeFor,
		setBackend: (next: ISearchIndexBackend | undefined) => {
			backend = next;
		},
	};
};

it('retains sealed rows across logout and a later login', async () => {
	const { login, writer, session, raw, setState, storeFor } = setup();
	await login();
	writer.index(message('retained'));
	await writer.flush();
	setState('DISABLED');
	expect(session.getActiveBackend()).toBeUndefined();
	await session.whenSettled();
	expect(raw.close).toHaveBeenCalledTimes(1);
	expect(raw.wipe).not.toHaveBeenCalled();
	await login();
	expect(storeFor('u1').documents.has('retained')).toBe(true);
	writer.dispose();
});

it('does not delete or stop indexing when reset is cancelled', async () => {
	const { login, writer, lifecycle, session, raw, stopIndexing, storeFor } = setup();
	await login();
	writer.index(message('retained'));
	await writer.flush();
	const previous = session.getActiveBackend();
	await expect(lifecycle.resetKey(async () => false)).resolves.toBe(false);
	expect(raw.wipe).not.toHaveBeenCalled();
	expect(stopIndexing).not.toHaveBeenCalled();
	expect(session.getActiveBackend()).toBe(previous);
	expect(storeFor('u1').documents.has('retained')).toBe(true);
	writer.dispose();
});

it('does not delete before reset succeeds and then wipes the captured user', async () => {
	const { login, writer, lifecycle, session, raw, storeFor } = setup();
	await login();
	writer.index(message('old'));
	await writer.flush();
	const reset = deferred<boolean>();
	const result = lifecycle.resetKey(() => reset.promise);
	await Promise.resolve();
	expect(raw.wipe).not.toHaveBeenCalled();
	expect(session.getActiveBackend()).toBeDefined();
	reset.resolve(true);
	await expect(result).resolves.toBe(true);
	expect(raw.wipe).toHaveBeenCalledWith({ userId: 'u1' });
	expect(session.getActiveBackend()).toBeUndefined();
	expect(storeFor('u1').documents.size).toBe(0);
	writer.dispose();
});

it('does not delete when the server reset fails', async () => {
	const { lifecycle, raw, stopIndexing } = setup();
	const error = new Error('reset failed');
	await expect(
		lifecycle.resetKey(async () => {
			throw error;
		}),
	).rejects.toBe(error);
	expect(raw.wipe).not.toHaveBeenCalled();
	expect(stopIndexing).not.toHaveBeenCalled();
});

it('waits for in-flight indexing and prevents queued or delayed decrypt writes after reset', async () => {
	const { login, writer, lifecycle, raw, stopIndexing, session, storeFor } = setup();
	await login();
	const previous = session.getActiveBackend()!;
	const delayedDecrypt = writer.bindToOpenIndex();
	writer.index(message('queued'));
	const stopped = deferred<void>();
	stopIndexing.mockReturnValueOnce(stopped.promise);
	const wiping = lifecycle.wipe();
	expect(session.getActiveBackend()).toBeUndefined();
	await expect(previous.upsert([])).rejects.toThrow('session has ended');
	await Promise.resolve();
	expect(raw.wipe).not.toHaveBeenCalled();
	stopped.resolve();
	await expect(wiping).resolves.toBe(true);
	await login();
	delayedDecrypt(message('late'));
	await writer.flush();
	expect(storeFor('u1').documents.size).toBe(0);
	expect(raw.upsert).not.toHaveBeenCalled();
	writer.dispose();
});

it('finishes a held write before deleting the index', async () => {
	const { login, writer, lifecycle, raw, storeFor } = setup();
	await login();
	const entered = deferred<void>();
	const release = deferred<void>();
	const upsert = raw.upsert.getMockImplementation()!;
	raw.upsert.mockImplementationOnce(async (docs) => {
		entered.resolve();
		await release.promise;
		await upsert(docs);
	});
	writer.index(message('in-flight'));
	const flushing = writer.flush();
	await entered.promise;
	const wiping = lifecycle.wipe();
	await Promise.resolve();
	expect(raw.wipe).not.toHaveBeenCalled();
	release.resolve();
	await flushing;
	await expect(wiping).resolves.toBe(true);
	expect(storeFor('u1').documents.size).toBe(0);
	writer.dispose();
});

it('deletes a closed index after successful reset while E2EE is locked', async () => {
	const { login, writer, lifecycle, state, setState, session, raw, storeFor } = setup();
	await login();
	writer.index(message('sealed'));
	await writer.flush();
	setState('DISABLED');
	state.key = undefined;
	setState('ENTER_PASSWORD');
	await session.whenSettled();
	await expect(lifecycle.resetKey(async () => true)).resolves.toBe(true);
	expect(raw.open).toHaveBeenCalledTimes(1);
	expect(raw.wipe).toHaveBeenCalledWith({ userId: 'u1' });
	expect(storeFor('u1').documents.size).toBe(0);
	writer.dispose();
});

it('does not delete the next user when identity changes during confirmation or reset', async () => {
	const { lifecycle, state, raw, storeFor } = setup();
	storeFor('u2').documents.set('other', { id: 'other' } as never);
	const reset = deferred<boolean>();
	const result = lifecycle.resetKey(() => reset.promise);
	state.userId = 'u2';
	reset.resolve(true);
	await expect(result).resolves.toBe(false);
	expect(raw.wipe).not.toHaveBeenCalled();
	expect(storeFor('u2').documents.has('other')).toBe(true);
});

it('captures the wipe scope before a delayed stop and serializes the next login', async () => {
	const { login, lifecycle, state, raw, stopIndexing, setState, session } = setup();
	await login();
	const stopping = deferred<void>();
	stopIndexing.mockReturnValueOnce(stopping.promise);
	const wiping = lifecycle.wipe();
	state.userId = 'u2';
	setState('READY');
	await Promise.resolve();
	expect(raw.open).toHaveBeenCalledTimes(1);
	stopping.resolve();
	await expect(wiping).resolves.toBe(true);
	await session.whenSettled();
	expect(raw.wipe).toHaveBeenCalledWith({ userId: 'u1' });
	expect(raw.open.mock.calls[1][0].userId).toBe('u2');
	expect(raw.wipe.mock.invocationCallOrder[0]).toBeLessThan(raw.open.mock.invocationCallOrder[1]);
});

it('cancels a delayed open and wipes its original backend even when the provider changes', async () => {
	const { login, lifecycle, raw, setBackend, session } = setup();
	const opening = deferred<E2EESearchOpenResult>();
	const entered = deferred<void>();
	raw.open.mockImplementationOnce(() => {
		entered.resolve();
		return opening.promise;
	});
	const loggingIn = login();
	await entered.promise;
	const other = createMemorySearchIndexBackend();
	other.wipe = jest.fn(other.wipe);
	setBackend(other);
	const wiping = lifecycle.wipe();
	opening.resolve(opened);
	await loggingIn;
	await expect(wiping).resolves.toBe(true);
	expect(session.getActiveBackend()).toBeUndefined();
	expect(raw.close).toHaveBeenCalledTimes(1);
	expect(raw.wipe).toHaveBeenCalledWith({ userId: 'u1' });
	expect(other.wipe).not.toHaveBeenCalled();
});

it.each(['user', 'backend'] as const)('reports no wipe without a %s', async (missing) => {
	const { lifecycle, state, setBackend, raw } = setup();
	if (missing === 'user') state.userId = undefined;
	else setBackend(undefined);
	await expect(lifecycle.wipe()).resolves.toBe(false);
	expect(raw.wipe).not.toHaveBeenCalled();
});

it('reports a wipe failure and keeps access revoked', async () => {
	const { login, lifecycle, raw, session } = setup();
	await login();
	const error = new Error('wipe failed');
	raw.wipe.mockRejectedValueOnce(error);
	await expect(lifecycle.wipe()).rejects.toBe(error);
	expect(session.getActiveBackend()).toBeUndefined();
});

it('does not wipe if indexing cannot stop', async () => {
	const { login, lifecycle, raw, session, stopIndexing } = setup();
	await login();
	const error = new Error('stop failed');
	stopIndexing.mockRejectedValueOnce(error);
	await expect(lifecycle.wipe()).rejects.toBe(error);
	expect(raw.wipe).not.toHaveBeenCalled();
	expect(session.getActiveBackend()).toBeUndefined();
});
