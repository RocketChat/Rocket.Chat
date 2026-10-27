import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';
import { Emitter } from '@rocket.chat/emitter';

import { createSearchIndexSession, deriveSearchIndexWrapKey } from './searchIndexSession';
import { generate } from '../e2ee/crypto/rsa';

const methods = ['open', 'upsert', 'remove', 'removeRoom', 'search', 'getRoomState', 'setRoomState', 'stats', 'wipe'] as const;

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
		expect(session.getActiveBackend()).toBe(backend);
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
		expect(session.getActiveBackend()).toBe(backend);
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

		expect(session.getActiveBackend()).toBe(backend);
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
		expect(session.getActiveBackend()).toBe(backend);
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
		expect(session.getActiveBackend()).toBe(backend);
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

		expect(seen).toEqual([backend, undefined]);
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

		expect(session.getActiveBackend()).toBe(backend);
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
});

describe('createSearchIndexSession with the admin setting', () => {
	it('wipes the index and never activates it when the workspace does not allow local search', async () => {
		const backend = createBackend();
		const { source, setState } = createSource(privateKey);
		const listener = jest.fn();
		const session = createSearchIndexSession(source, { getBackend: () => backend, isAllowed: () => false });
		session.subscribe(listener);

		setState('READY');
		await session.whenSettled();

		expect(backend.open).toHaveBeenCalledTimes(1);
		expect(backend.wipe).toHaveBeenCalledTimes(1);
		expect(backend.upsert).not.toHaveBeenCalled();
		expect(session.getActiveBackend()).toBeUndefined();
		expect(listener).not.toHaveBeenCalled();
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
		expect(session.getActiveBackend()).toBe(backend);
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
		expect(session.getActiveBackend()).toBe(backend);

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

		expect(backend.open).toHaveBeenCalledTimes(2);
		expect(session.getActiveBackend()).toBe(backend);
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
