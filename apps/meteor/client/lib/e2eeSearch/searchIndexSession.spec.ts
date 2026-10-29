import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { Emitter } from '@rocket.chat/emitter';

import { createSearchIndexSession, deriveSearchIndexWrapKey } from './searchIndexSession';
import { generate } from '../e2ee/crypto/rsa';

const methods = ['open', 'upsert', 'remove', 'removeRoom', 'listRooms', 'search', 'getRoomState', 'setRoomState', 'stats', 'wipe'] as const;

const createBackend = () => {
	const backend = Object.fromEntries(
		methods.map((method) => [method, jest.fn(async () => undefined)]),
	) as unknown as jest.Mocked<ISearchIndexBackend>;
	backend.open.mockResolvedValue({ schemaVersion: 1, encryptedAtRest: true });
	return backend;
};

const createSource = (privateKey: CryptoKey | undefined, userId: string | undefined = 'u1') => {
	const emitter = new Emitter<{ E2E_STATE_CHANGED: { prevState: string; nextState: string } }>();
	const state: { userId: string | undefined; privateKey: CryptoKey | undefined; current: string } = {
		userId,
		privateKey,
		current: 'NOT_STARTED',
	};
	return {
		state,
		source: {
			on: (type: 'E2E_STATE_CHANGED', handler: (change: { prevState: string; nextState: string }) => void) => emitter.on(type, handler),
			getUserId: () => state.userId,
			getPrivateKey: () => state.privateKey,
		},
		setState: (nextState: string) => {
			const prevState = state.current;
			state.current = nextState;
			emitter.emit('E2E_STATE_CHANGED', { prevState, nextState });
		},
	};
};

const holdOpen = (backend: jest.Mocked<ISearchIndexBackend>) => {
	let resolveOpen: (value: { schemaVersion: number; encryptedAtRest: boolean }) => void = () => undefined;
	let markOpened: () => void = () => undefined;
	const opened = new Promise<void>((resolve) => {
		markOpened = resolve;
	});
	backend.open.mockImplementation(
		() =>
			new Promise((resolve) => {
				resolveOpen = resolve;
				markOpened();
			}),
	);
	return { opened, resolveOpen: (value: { schemaVersion: number; encryptedAtRest: boolean }) => resolveOpen(value) };
};

const waitForCall = async (fn: { mock: { calls: unknown[] } }) => {
	for (let i = 0; i < 20 && fn.mock.calls.length === 0; i++) await new Promise((resolve) => setTimeout(resolve, 0));
};

const toHex = (bytes: Uint8Array) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');

let privateKey: CryptoKey;
let otherPrivateKey: CryptoKey;

beforeAll(async () => {
	privateKey = (await generate()).privateKey;
	otherPrivateKey = (await generate()).privateKey;
});

describe('deriveSearchIndexWrapKey', () => {
	it('gives 32 bytes', async () => {
		const wrapKey = await deriveSearchIndexWrapKey(privateKey, 'u1');

		expect(wrapKey).toBeInstanceOf(Uint8Array);
		expect(wrapKey.byteLength).toBe(32);
	});

	it('gives the same bytes for the same key, also after the key is exported and imported again', async () => {
		const jwk = await crypto.subtle.exportKey('jwk', privateKey);
		const reimported = await crypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']);

		const first = toHex(await deriveSearchIndexWrapKey(privateKey, 'u1'));

		expect(toHex(await deriveSearchIndexWrapKey(privateKey, 'u1'))).toBe(first);
		expect(toHex(await deriveSearchIndexWrapKey(reimported, 'u1'))).toBe(first);
	});

	it('gives other bytes for another private key', async () => {
		expect(toHex(await deriveSearchIndexWrapKey(otherPrivateKey, 'u1'))).not.toBe(toHex(await deriveSearchIndexWrapKey(privateKey, 'u1')));
	});

	it('gives other bytes for another user with the same key', async () => {
		expect(toHex(await deriveSearchIndexWrapKey(privateKey, 'u2'))).not.toBe(toHex(await deriveSearchIndexWrapKey(privateKey, 'u1')));
	});

	it('does not contain the private exponent', async () => {
		const { d } = await crypto.subtle.exportKey('jwk', privateKey);
		const wrapKey = await deriveSearchIndexWrapKey(privateKey, 'u1');

		const exponent = Buffer.from(d as string, 'base64url');

		expect(exponent.indexOf(Buffer.from(wrapKey))).toBe(-1);
	});
});

describe('createSearchIndexSession', () => {
	it('opens the index with the user ID and the derived wrap key when E2EE is ready', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await session.whenSettled();

		expect(backend.open).toHaveBeenCalledTimes(1);
		const [scope] = backend.open.mock.calls[0];
		expect(Object.keys(scope).sort()).toEqual(['userId', 'wrapKey']);
		expect(scope.userId).toBe('u1');
		expect(toHex(scope.wrapKey as Uint8Array)).toBe(toHex(await deriveSearchIndexWrapKey(privateKey, 'u1')));
		expect(session.getActiveBackend()).toBeDefined();
	});

	it('sends no private key material across the bridge', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await session.whenSettled();

		const jwk = await crypto.subtle.exportKey('jwk', privateKey);
		const [scope] = backend.open.mock.calls[0];
		const sent = JSON.stringify(scope, (_key, value) => (value instanceof Uint8Array ? Buffer.from(value).toString('base64url') : value));
		for (const part of ['d', 'p', 'q', 'dp', 'dq', 'qi'] as const) {
			expect(sent).not.toContain(jwk[part]);
		}
		expect(Object.values(scope).some((value) => typeof value === 'object' && value !== null && 'algorithm' in value)).toBe(false);
	});

	it('opens also in the save-password state, and only once for the same user', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await session.whenSettled();
		setState('LOADING_KEYS');
		setState('SAVE_PASSWORD');
		await session.whenSettled();
		setState('READY');
		await session.whenSettled();

		expect(backend.open).toHaveBeenCalledTimes(1);
		expect(session.getActiveBackend()).toBeDefined();
	});

	it('is not active before the open resolves', async () => {
		const backend = createBackend();
		const { opened, resolveOpen } = holdOpen(backend);
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await opened;

		expect(backend.open).toHaveBeenCalled();
		expect(session.getActiveBackend()).toBeUndefined();

		resolveOpen({ schemaVersion: 1, encryptedAtRest: true });
		await session.whenSettled();

		expect(session.getActiveBackend()).toBeDefined();
	});

	it('stops using the index on logout, and opens it again on the next login', async () => {
		const backend = createBackend();
		const { source, state, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await session.whenSettled();
		state.userId = undefined;
		state.privateKey = undefined;
		setState('DISABLED');

		expect(session.getActiveBackend()).toBeUndefined();

		state.userId = 'u1';
		state.privateKey = privateKey;
		setState('READY');
		await session.whenSettled();

		expect(backend.open).toHaveBeenCalledTimes(2);
		expect(session.getActiveBackend()).toBeDefined();
	});

	it('opens the index of the new user after a logout and a login as another user', async () => {
		const backend = createBackend();
		const { source, state, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await session.whenSettled();
		setState('DISABLED');
		state.userId = 'u2';
		state.privateKey = otherPrivateKey;
		setState('READY');
		await session.whenSettled();

		const [scope] = backend.open.mock.calls[1];
		expect(scope.userId).toBe('u2');
		expect(toHex(scope.wrapKey as Uint8Array)).toBe(toHex(await deriveSearchIndexWrapKey(otherPrivateKey, 'u2')));
	});

	it('closes the index of the previous user and opens the index of the new user after a login as another user with no logout', async () => {
		const backend = createBackend();
		const close = jest.fn(async () => undefined);
		backend.close = close;
		const { source, state, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await session.whenSettled();
		// `loginWithToken` on the same page: the user changes, and E2EE starts again for the new user with no logout.
		state.userId = 'u2';
		state.privateKey = otherPrivateKey;

		expect(session.getActiveBackend()).toBeUndefined();
		expect(session.isEncryptedAtRest()).toBeUndefined();

		setState('READY');
		await session.whenSettled();

		expect(close).toHaveBeenCalledTimes(1);
		expect(backend.open).toHaveBeenCalledTimes(2);
		expect(close.mock.invocationCallOrder[0]).toBeLessThan(backend.open.mock.invocationCallOrder[1]);
		const [scope] = backend.open.mock.calls[1];
		expect(scope.userId).toBe('u2');
		expect(toHex(scope.wrapKey as Uint8Array)).toBe(toHex(await deriveSearchIndexWrapKey(otherPrivateKey, 'u2')));
		expect(session.getActiveBackend()).toBeDefined();
	});

	it('closes the index of the previous user when another user logs in with no logout, before E2EE of the new user is ready', async () => {
		const backend = createBackend();
		backend.close = jest.fn(async () => undefined);
		const listener = jest.fn();
		const { source, state, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await session.whenSettled();
		session.subscribe(listener);
		state.userId = 'u2';
		state.privateKey = undefined;
		setState('ENTER_PASSWORD');
		await session.whenSettled();

		expect(backend.close).toHaveBeenCalledTimes(1);
		expect(backend.open).toHaveBeenCalledTimes(1);
		expect(listener).toHaveBeenCalledTimes(1);
		expect(session.getActiveBackend()).toBeUndefined();

		session.recheck();
		await session.whenSettled();

		expect(backend.open).toHaveBeenCalledTimes(1);
	});

	it('does not activate an open of the previous user that resolves after a login as another user', async () => {
		const backend = createBackend();
		const { opened, resolveOpen } = holdOpen(backend);
		const { source, state, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await opened;
		state.userId = 'u2';
		setState('ENTER_PASSWORD');
		resolveOpen({ schemaVersion: 1, encryptedAtRest: true });
		await session.whenSettled();

		expect(session.getActiveBackend()).toBeUndefined();
	});

	it('does not activate an open that resolves after the logout', async () => {
		const backend = createBackend();
		const { opened, resolveOpen } = holdOpen(backend);
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await opened;
		setState('DISABLED');
		resolveOpen({ schemaVersion: 1, encryptedAtRest: true });
		await session.whenSettled();

		expect(session.getActiveBackend()).toBeUndefined();
	});

	it.each(['ERROR', 'NOT_STARTED'])('stops using the index when E2EE goes to %s', async (stoppedState) => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await session.whenSettled();
		setState(stoppedState);

		expect(session.getActiveBackend()).toBeUndefined();
	});

	it('closes the index on logout when the desktop app offers close', async () => {
		const backend = createBackend();
		backend.close = jest.fn(async () => undefined);
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await session.whenSettled();
		setState('DISABLED');
		await session.whenSettled();

		expect(backend.close).toHaveBeenCalledTimes(1);
		expect(backend.wipe).not.toHaveBeenCalled();
		expect(session.getActiveBackend()).toBeUndefined();
	});

	it('closes nothing on logout when no index is open', async () => {
		const backend = createBackend();
		backend.close = jest.fn(async () => undefined);
		const { source, setState } = createSource(privateKey);
		createSearchIndexSession(source, { getBackend: () => backend });

		setState('DISABLED');

		expect(backend.close).not.toHaveBeenCalled();
	});

	it('reports a failed close and stays inactive', async () => {
		const backend = createBackend();
		const error = new Error('close failed');
		backend.close = jest.fn(async () => {
			throw error;
		});
		const onError = jest.fn();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend, onError });

		setState('READY');
		await session.whenSettled();
		setState('DISABLED');
		await session.whenSettled();

		expect(onError).toHaveBeenCalledWith(error);
		expect(session.getActiveBackend()).toBeUndefined();
	});

	it('only stops using the index on logout when the desktop app has no close (the desktop app closes it itself)', async () => {
		const backend = createBackend();
		const onError = jest.fn();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend, onError });

		setState('READY');
		await session.whenSettled();
		setState('DISABLED');
		await session.whenSettled();

		expect(backend.close).toBeUndefined();
		expect(onError).not.toHaveBeenCalled();
		expect(session.getActiveBackend()).toBeUndefined();
	});

	it('does nothing when no backend exists (normal browser, old desktop)', async () => {
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => undefined });

		setState('READY');
		await session.whenSettled();

		expect(session.getActiveBackend()).toBeUndefined();
	});

	it('does not open without a private key', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(undefined);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await session.whenSettled();

		expect(backend.open).not.toHaveBeenCalled();
	});

	it('reports a failed open, stays inactive, and tries again on the next ready state', async () => {
		const backend = createBackend();
		backend.open.mockRejectedValueOnce(new Error('index locked'));
		const onError = jest.fn();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend, onError });

		setState('READY');
		await session.whenSettled();

		expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'index locked' }));
		expect(session.getActiveBackend()).toBeUndefined();

		setState('SAVE_PASSWORD');
		await session.whenSettled();

		expect(backend.open).toHaveBeenCalledTimes(2);
		expect(session.getActiveBackend()).toBeDefined();
	});

	it('does not use an index that the desktop app reports as locked, and opens it again on the next ready state', async () => {
		const backend = createBackend();
		backend.open.mockResolvedValueOnce({ schemaVersion: 1, encryptedAtRest: false, locked: true });
		const onError = jest.fn();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend, onError });

		setState('READY');
		await session.whenSettled();

		expect(session.getActiveBackend()).toBeUndefined();
		expect(onError).not.toHaveBeenCalled();

		setState('SAVE_PASSWORD');
		await session.whenSettled();

		expect(backend.open).toHaveBeenCalledTimes(2);
		expect(session.getActiveBackend()).toBeDefined();
	});

	it('stops listening after dispose', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		session.dispose();
		setState('READY');
		await session.whenSettled();

		expect(backend.open).not.toHaveBeenCalled();
	});

	it('tells the subscribers when the active backend changes, at the open and at the logout', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });
		const seen: Array<ISearchIndexBackend | undefined> = [];
		session.subscribe(() => seen.push(session.getActiveBackend()));

		setState('READY');
		await session.whenSettled();
		setState('READY');
		await session.whenSettled();
		setState('DISABLED');

		expect(seen.map(Boolean)).toEqual([true, false]);
	});

	it('does not tell a subscriber that unsubscribed', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });
		const listener = jest.fn();
		const unsubscribe = session.subscribe(listener);

		unsubscribe();
		setState('READY');
		await session.whenSettled();

		expect(session.getActiveBackend()).toBeDefined();
		expect(listener).not.toHaveBeenCalled();
	});

	it('tells the subscribers nothing when an open fails', async () => {
		const backend = createBackend();
		backend.open.mockRejectedValueOnce(new Error('index locked'));
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend, onError: () => undefined });
		const listener = jest.fn();
		session.subscribe(listener);

		setState('READY');
		await session.whenSettled();

		expect(listener).not.toHaveBeenCalled();
	});

	it('reports whether the open index is encrypted at rest, as the open reported it, and nothing while no index is open', async () => {
		const backend = createBackend();
		backend.open.mockResolvedValue({ schemaVersion: 1, encryptedAtRest: false });
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		expect(session.isEncryptedAtRest()).toBeUndefined();

		setState('READY');
		await session.whenSettled();
		expect(session.isEncryptedAtRest()).toBe(false);

		setState('DISABLED');
		expect(session.isEncryptedAtRest()).toBeUndefined();

		backend.open.mockResolvedValue({ schemaVersion: 1, encryptedAtRest: true });
		setState('READY');
		await session.whenSettled();
		expect(session.isEncryptedAtRest()).toBe(true);
	});
});

describe('createSearchIndexSession backend of one open', () => {
	it('forwards the calls of the active backend to the backend', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await session.whenSettled();
		await session.getActiveBackend()?.search({ text: 'needle' });
		backend.listRooms.mockResolvedValue(['r1']);

		expect(backend.search).toHaveBeenCalledWith({ text: 'needle' });
		expect(await session.getActiveBackend()?.listRooms()).toEqual(['r1']);
		expect(backend.listRooms).toHaveBeenCalledTimes(1);
	});

	it('gives each open its own backend, also when the backend is one shared object', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await session.whenSettled();
		const first = session.getActiveBackend();
		setState('DISABLED');
		setState('READY');
		await session.whenSettled();

		expect(session.getActiveBackend()).toBeDefined();
		expect(session.getActiveBackend()).not.toBe(first);
	});

	it('rejects each call of the backend of an ended session, so it reaches no index after a logout or a user switch', async () => {
		const backend = createBackend();
		const { source, state, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await session.whenSettled();
		const previous = session.getActiveBackend();
		state.userId = 'u2';
		setState('READY');
		await session.whenSettled();
		backend.upsert.mockClear();
		backend.setRoomState.mockClear();
		backend.wipe.mockClear();

		await expect(previous?.upsert([])).rejects.toThrow('The E2EE search index session has ended');
		await expect(previous?.setRoomState('r1', { backfillDone: true })).rejects.toThrow();
		await expect(previous?.wipe()).rejects.toThrow();
		expect(backend.upsert).not.toHaveBeenCalled();
		expect(backend.setRoomState).not.toHaveBeenCalled();
		expect(backend.wipe).not.toHaveBeenCalled();

		const beforeLogout = session.getActiveBackend();
		expect(beforeLogout).toBeDefined();
		setState('DISABLED');
		await session.whenSettled();

		await expect(beforeLogout?.upsert([])).rejects.toThrow('The E2EE search index session has ended');
		await expect(beforeLogout?.listRooms()).rejects.toThrow();
		await expect(beforeLogout?.wipe()).rejects.toThrow();
		expect(backend.upsert).not.toHaveBeenCalled();
		expect(backend.listRooms).not.toHaveBeenCalled();
		expect(backend.wipe).not.toHaveBeenCalled();
	});

	it('closes an index whose open resolves after the logout', async () => {
		const backend = createBackend();
		backend.close = jest.fn(async () => undefined);
		const { opened, resolveOpen } = holdOpen(backend);
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend });

		setState('READY');
		await opened;
		setState('DISABLED');
		resolveOpen({ schemaVersion: 1, encryptedAtRest: true });
		await session.whenSettled();

		expect(session.getActiveBackend()).toBeUndefined();
		expect(backend.close).toHaveBeenCalledTimes(1);
	});
});

describe('createSearchIndexSession with the admin setting', () => {
	it('wipes the index of the user without an open and never activates it when the workspace does not allow local search', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		const listener = jest.fn();
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => false });
		session.subscribe(listener);

		setState('READY');
		await session.whenSettled();

		expect(backend.open).not.toHaveBeenCalled();
		expect(backend.wipe).toHaveBeenCalledTimes(1);
		expect(backend.wipe).toHaveBeenCalledWith({ userId: 'u1' });
		expect(backend.upsert).not.toHaveBeenCalled();
		expect(session.getActiveBackend()).toBeUndefined();
		expect(listener).not.toHaveBeenCalled();
	});

	it('opens the index when the user turns the local search on while the wipe without an open runs', async () => {
		const backend = createBackend();
		let allowed = false;
		backend.wipe.mockImplementation(async () => {
			allowed = true;
		});
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => allowed });

		setState('READY');
		await session.whenSettled();

		expect(backend.wipe).toHaveBeenCalledWith({ userId: 'u1' });
		expect(backend.open).toHaveBeenCalledTimes(1);
		expect(session.getActiveBackend()).toBeDefined();
	});

	it('opens the index and wipes nothing when the local search is allowed', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => true });

		setState('READY');
		await session.whenSettled();

		expect(backend.open).toHaveBeenCalledTimes(1);
		expect(backend.wipe).not.toHaveBeenCalled();
		expect(session.getActiveBackend()).toBeDefined();
	});

	it('reads the setting at each login: off wipes, on opens and activates', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		let allowed = false;
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => allowed });

		setState('READY');
		await session.whenSettled();
		expect(session.getActiveBackend()).toBeUndefined();

		setState('DISABLED');
		allowed = true;
		setState('READY');
		await session.whenSettled();

		expect(backend.wipe).toHaveBeenCalledTimes(1);
		expect(session.getActiveBackend()).toBeDefined();
	});

	it('wipes and stops using the open index when a recheck finds that it is not allowed any more', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		let allowed = true;
		const listener = jest.fn();
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => allowed });
		session.subscribe(listener);

		setState('READY');
		await session.whenSettled();
		expect(session.getActiveBackend()).toBeDefined();

		allowed = false;
		session.recheck();
		await session.whenSettled();

		expect(backend.wipe).toHaveBeenCalledTimes(1);
		expect(session.getActiveBackend()).toBeUndefined();
		expect(listener).toHaveBeenCalledTimes(2);
	});

	it('opens and activates the index when a recheck finds that it is allowed while E2EE is ready', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		let allowed = false;
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => allowed });

		setState('READY');
		await session.whenSettled();
		expect(session.getActiveBackend()).toBeUndefined();

		allowed = true;
		session.recheck();
		await session.whenSettled();

		expect(backend.open).toHaveBeenCalledTimes(1);
		expect(session.getActiveBackend()).toBeDefined();
	});

	it('does not open on a recheck while E2EE is not ready', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => true });

		session.recheck();
		await session.whenSettled();
		expect(backend.open).not.toHaveBeenCalled();

		setState('READY');
		await session.whenSettled();
		setState('DISABLED');
		session.recheck();
		await session.whenSettled();

		expect(backend.open).toHaveBeenCalledTimes(1);
		expect(session.getActiveBackend()).toBeUndefined();
	});

	it('wipes the closed index of the user while E2EE waits for the password, when the local search is not allowed', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(undefined);
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => false });

		setState('LOADING_KEYS');
		setState('ENTER_PASSWORD');
		await session.whenSettled();

		expect(backend.wipe).toHaveBeenCalledTimes(1);
		expect(backend.wipe).toHaveBeenCalledWith({ userId: 'u1' });
		expect(backend.open).not.toHaveBeenCalled();
	});

	it('wipes nothing in the disabled state, which also comes before the settings load', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(undefined);
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => false });

		setState('DISABLED');
		session.recheck();
		await session.whenSettled();

		expect(backend.wipe).not.toHaveBeenCalled();
	});

	it('wipes nothing while E2EE is locked when the local search is allowed', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(undefined);
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => true });

		setState('ENTER_PASSWORD');
		await session.whenSettled();

		expect(backend.wipe).not.toHaveBeenCalled();
	});

	it('wipes the closed index when the user opts out while E2EE is locked', async () => {
		const backend = createBackend();
		let allowed = true;
		const { source, setState } = createSource(undefined);
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => allowed });

		setState('ENTER_PASSWORD');
		await session.whenSettled();
		allowed = false;
		session.recheck();
		await session.whenSettled();

		expect(backend.wipe).toHaveBeenCalledTimes(1);
		expect(backend.wipe).toHaveBeenCalledWith({ userId: 'u1' });
	});

	it('wipes the closed index when the user opts out after a key error', async () => {
		const backend = createBackend();
		let allowed = true;
		const { source, setState } = createSource(undefined);
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => allowed });

		setState('LOADING_KEYS');
		setState('ERROR');
		await session.whenSettled();
		expect(backend.wipe).not.toHaveBeenCalled();
		allowed = false;
		session.recheck();
		await session.whenSettled();

		expect(backend.wipe).toHaveBeenCalledTimes(1);
		expect(backend.wipe).toHaveBeenCalledWith({ userId: 'u1' });
	});

	it('does not run a locked-state wipe queued for one user after another user logged in', async () => {
		const backend = createBackend();
		let finishFirstWipe: () => void = () => undefined;
		backend.wipe.mockImplementationOnce(
			() =>
				new Promise<undefined>((resolve) => {
					finishFirstWipe = () => resolve(undefined);
				}),
		);
		const allowedFor = new Set<string>();
		const { source, state, setState } = createSource(undefined);
		const session = createSearchIndexSession(source, {
			getBackend: () => backend,
			isAllowed: () => !!state.userId && allowedFor.has(state.userId),
		});

		setState('ENTER_PASSWORD');
		await waitForCall(backend.wipe);
		session.recheck();
		state.userId = 'u2';
		finishFirstWipe();
		await session.whenSettled();

		expect(backend.wipe).toHaveBeenCalledTimes(1);
		expect(backend.wipe).toHaveBeenCalledWith({ userId: 'u1' });
	});

	it('opens the index again only after the wipe of a withdrawn index has ended', async () => {
		const backend = createBackend();
		let allowed = true;
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => allowed });
		const order: string[] = [];

		setState('READY');
		await session.whenSettled();
		let endWipe: () => void = () => undefined;
		backend.wipe.mockImplementation(
			() =>
				new Promise<void>((resolve) => {
					endWipe = () => {
						order.push('wipe');
						resolve();
					};
				}),
		);
		backend.open.mockImplementation(async () => {
			order.push('open');
			return { schemaVersion: 1, encryptedAtRest: true };
		});

		allowed = false;
		session.recheck();
		allowed = true;
		session.recheck();
		for (let i = 0; i < 50 && backend.wipe.mock.calls.length === 0; i++) await Promise.resolve();
		endWipe();
		await session.whenSettled();

		expect(order).toEqual(['wipe', 'open']);
		expect(session.getActiveBackend()).toBeDefined();
	});

	it('reports a failed wipe and stays inactive', async () => {
		const backend = createBackend();
		backend.wipe.mockRejectedValue(new Error('wipe failed'));
		const onError = jest.fn();
		const { source, setState } = createSource(privateKey);
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => false, onError });

		setState('READY');
		await session.whenSettled();

		expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'wipe failed' }));
		expect(session.getActiveBackend()).toBeUndefined();
	});
});
