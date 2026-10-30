import type { E2EESearchIndexEvent, E2EESearchOpenResult, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { createSearchIndexSession, deriveSearchIndexWrapKey } from './searchIndexSession';
import type { SearchIndexSessionSource } from './searchIndexSession';

const opened: E2EESearchOpenResult = {
	schemaVersion: 1,
	encryptedAtRest: true,
	capabilities: { recentCursor: 1, lifecycleEvents: 1, close: 1 },
};
const deferred = <T>() => {
	let resolve!: (value: T) => void;
	let reject!: (error: Error) => void;
	const promise = new Promise<T>((done, fail) => {
		resolve = done;
		reject = fail;
	});
	return { promise, resolve, reject };
};
const createBackend = () => {
	const backend = {
		open: jest.fn<ReturnType<ISearchIndexBackend['open']>, Parameters<ISearchIndexBackend['open']>>(async () => opened),
		upsert: jest.fn<ReturnType<ISearchIndexBackend['upsert']>, Parameters<ISearchIndexBackend['upsert']>>(async () => undefined),
		remove: jest.fn<ReturnType<ISearchIndexBackend['remove']>, Parameters<ISearchIndexBackend['remove']>>(async () => undefined),
		removeRoom: jest.fn<ReturnType<ISearchIndexBackend['removeRoom']>, Parameters<ISearchIndexBackend['removeRoom']>>(
			async () => undefined,
		),
		listRooms: jest.fn<ReturnType<ISearchIndexBackend['listRooms']>, Parameters<ISearchIndexBackend['listRooms']>>(async () => []),
		search: jest.fn<ReturnType<ISearchIndexBackend['search']>, Parameters<ISearchIndexBackend['search']>>(async () => []),
		searchRecentPage: jest.fn<
			ReturnType<NonNullable<ISearchIndexBackend['searchRecentPage']>>,
			Parameters<NonNullable<ISearchIndexBackend['searchRecentPage']>>
		>(async () => ({ hits: [] })),
		onIndexEvent: jest.fn((_listener: (event: E2EESearchIndexEvent) => void) => jest.fn()),
		getRoomState: jest.fn<ReturnType<ISearchIndexBackend['getRoomState']>, Parameters<ISearchIndexBackend['getRoomState']>>(
			async () => undefined,
		),
		setRoomState: jest.fn<ReturnType<ISearchIndexBackend['setRoomState']>, Parameters<ISearchIndexBackend['setRoomState']>>(
			async () => undefined,
		),
		stats: jest.fn<ReturnType<ISearchIndexBackend['stats']>, Parameters<ISearchIndexBackend['stats']>>(async () => ({
			docs: 0,
			bytes: 0,
			rooms: 0,
		})),
		wipe: jest.fn<ReturnType<ISearchIndexBackend['wipe']>, Parameters<ISearchIndexBackend['wipe']>>(async () => undefined),
		close: jest.fn<ReturnType<NonNullable<ISearchIndexBackend['close']>>, Parameters<NonNullable<ISearchIndexBackend['close']>>>(
			async () => undefined,
		),
	} satisfies jest.Mocked<Required<ISearchIndexBackend>>;
	return backend;
};
let privateKey: CryptoKey;
let otherKey: CryptoKey;
beforeAll(async () => {
	const generate = async () =>
		crypto.subtle.generateKey({ name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, [
			'encrypt',
			'decrypt',
		]);
	privateKey = (await generate()).privateKey;
	otherKey = (await generate()).privateKey;
});
const setup = (options: { allowed?: boolean; key?: CryptoKey | null; backend?: ISearchIndexBackend | null } = {}) => {
	const raw = createBackend();
	const state = {
		userId: 'u1' as string | undefined,
		key: options.key === null ? undefined : (options.key ?? privateKey),
		allowed: options.allowed ?? true,
	};
	let listener: Parameters<SearchIndexSessionSource['on']>[1] | undefined;
	const off = jest.fn(() => {
		listener = undefined;
	});
	const source: SearchIndexSessionSource = {
		on: (_type, handler) => {
			listener = handler;
			return off;
		},
		getUserId: () => state.userId,
		getPrivateKey: () => state.key,
	};
	let backend = options.backend === null ? undefined : (options.backend ?? raw);
	const getBackend = jest.fn(() => backend);
	const onError = jest.fn();
	const session = createSearchIndexSession(source, { getBackend, isAllowed: () => state.allowed, onError });
	return {
		raw,
		state,
		source,
		session,
		onError,
		off,
		getBackend,
		setBackend: (next: ISearchIndexBackend) => {
			backend = next;
		},
		setState: (nextState: string) => listener?.({ prevState: '', nextState }),
	};
};
const waitForCall = async (fn: { mock: { calls: unknown[] } }) => {
	for (let i = 0; i < 50 && fn.mock.calls.length === 0; i++) await new Promise((done) => setTimeout(done, 0));
	expect(fn.mock.calls.length).toBeGreaterThan(0);
};
const hex = (value: Uint8Array) => Buffer.from(value).toString('hex');

describe('deriveSearchIndexWrapKey', () => {
	it('preserves the pinned HKDF label and derivation', async () => {
		const exportKey = jest.spyOn(crypto.subtle, 'exportKey').mockResolvedValueOnce({ d: 'private-exponent' });
		try {
			expect(hex(await deriveSearchIndexWrapKey(privateKey, 'u1'))).toBe(
				'3d32529c184387cd5e7582c53f6367c44522d507137038728c74909d46f9957f',
			);
		} finally {
			exportKey.mockRestore();
		}
	});
	it('derives 32 stable bytes after key export and import', async () => {
		const jwk = await crypto.subtle.exportKey('jwk', privateKey);
		const imported = await crypto.subtle.importKey('jwk', jwk, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']);
		const first = await deriveSearchIndexWrapKey(privateKey, 'u1');
		expect(first.byteLength).toBe(32);
		expect(hex(await deriveSearchIndexWrapKey(imported, 'u1'))).toBe(hex(first));
		expect(Buffer.from(jwk.d!, 'base64url').indexOf(Buffer.from(first))).toBe(-1);
	});
	it('separates users and private keys', async () => {
		const first = hex(await deriveSearchIndexWrapKey(privateKey, 'u1'));
		expect(hex(await deriveSearchIndexWrapKey(privateKey, 'u2'))).not.toBe(first);
		expect(hex(await deriveSearchIndexWrapKey(otherKey, 'u1'))).not.toBe(first);
	});
	it('rejects a key with no private exponent', async () => {
		const exported = jest.spyOn(crypto.subtle, 'exportKey').mockResolvedValueOnce({});
		try {
			await expect(deriveSearchIndexWrapKey(privateKey, 'u1')).rejects.toThrow('no private exponent');
		} finally {
			exported.mockRestore();
		}
	});
});

describe('search index session', () => {
	it('defaults to disallowed without creating an index', async () => {
		const { source, raw } = setup();
		let ready!: Parameters<SearchIndexSessionSource['on']>[1];
		const session = createSearchIndexSession(
			{
				...source,
				on: (_type, handler) => {
					ready = handler;
					return () => undefined;
				},
			},
			{ getBackend: () => raw },
		);
		ready({ prevState: '', nextState: 'READY' });
		await session.whenSettled();
		expect(raw.open).not.toHaveBeenCalled();
		expect(raw.wipe).toHaveBeenCalledWith({ userId: 'u1' });
		expect(session.getActiveBackend()).toBeUndefined();
	});
	it('opens once for READY and SAVE_PASSWORD with only a user ID and wrap key', async () => {
		const { session, raw, setState } = setup();
		setState('READY');
		setState('SAVE_PASSWORD');
		await session.whenSettled();
		expect(raw.open).toHaveBeenCalledTimes(1);
		const [scope] = raw.open.mock.calls[0];
		expect(Object.keys(scope).sort()).toEqual(['userId', 'wrapKey']);
		expect(scope.userId).toBe('u1');
		expect(hex(scope.wrapKey!)).toBe(hex(await deriveSearchIndexWrapKey(privateKey, 'u1')));
		expect(session.getActiveBackend()).not.toBe(raw);
		expect(session.getOpenResult()).toEqual(opened);
		expect(session.isEncryptedAtRest()).toBe(true);
	});
	it.each(['capability-recent', 'capability-events', 'capability-close', 'no-capabilities', 'searchRecentPage', 'onIndexEvent', 'close'])(
		'keeps an unsupported backend inactive: %s',
		async (missing) => {
			const { session, raw, setState } = setup();
			const listener = jest.fn();
			session.subscribe(listener);
			if (missing === 'no-capabilities') raw.open.mockResolvedValue({ schemaVersion: 1, encryptedAtRest: true });
			else if (missing.startsWith('capability-')) {
				const capabilities = { ...opened.capabilities! };
				const key = { 'capability-recent': 'recentCursor', 'capability-events': 'lifecycleEvents', 'capability-close': 'close' }[
					missing
				] as keyof typeof capabilities;
				delete (capabilities as Partial<typeof capabilities>)[key];
				raw.open.mockResolvedValue({ ...opened, capabilities });
			} else delete (raw as Partial<typeof raw>)[missing as 'searchRecentPage' | 'onIndexEvent' | 'close'];
			setState('READY');
			await session.whenSettled();
			expect(session.getActiveBackend()).toBeUndefined();
			expect(session.getOpenResult()).toEqual(await raw.open.mock.results[0].value);
			expect(raw.upsert).not.toHaveBeenCalled();
			expect(raw.wipe).not.toHaveBeenCalled();
			if (raw.close) expect(raw.close).toHaveBeenCalledTimes(1);
			expect(session.getStatus()).toBe('unsupported');
			expect(listener).toHaveBeenCalledTimes(2);
			setState('NOT_STARTED');
			expect(session.getOpenResult()).toBeUndefined();
			expect(session.getStatus()).toBe('idle');
			expect(listener).toHaveBeenCalledTimes(3);
		},
	);
	it('reports pending, locked, and ready availability and preserves the locked open result', async () => {
		const { session, raw, setState } = setup();
		const held = deferred<E2EESearchOpenResult>();
		const locked = { ...opened, locked: true as const };
		const listener = jest.fn();
		session.subscribe(listener);
		expect(session.getStatus()).toBe('idle');
		raw.open.mockReturnValueOnce(held.promise);
		setState('READY');
		await waitForCall(raw.open);
		expect(session.getStatus()).toBe('opening');
		expect(session.getActiveBackend()).toBeUndefined();
		held.resolve(locked);
		await session.whenSettled();
		expect(session.getStatus()).toBe('locked');
		expect(session.getOpenResult()).toEqual(locked);
		expect(listener).toHaveBeenCalledTimes(2);
		session.recheck();
		await session.whenSettled();
		expect(session.getStatus()).toBe('ready');
		expect(session.getOpenResult()).toEqual(opened);
		expect(session.getActiveBackend()).toBeDefined();
		expect(raw.close).not.toHaveBeenCalled();
		expect(raw.wipe).not.toHaveBeenCalled();
	});
	it.each(['locked', 'unavailable'] as const)('clears %s availability on stop and user switch', async (status) => {
		const { session, raw, setState, state } = setup();
		const fail = () => {
			if (status === 'locked') raw.open.mockResolvedValueOnce({ ...opened, locked: true });
			else raw.open.mockRejectedValueOnce(new Error('open failed'));
		};
		fail();
		setState('READY');
		await session.whenSettled();
		expect(session.getStatus()).toBe(status);
		setState('NOT_STARTED');
		expect(session.getStatus()).toBe('idle');
		expect(session.getOpenResult()).toBeUndefined();
		fail();
		setState('READY');
		await session.whenSettled();
		state.userId = 'u2';
		expect(session.getStatus()).toBe('idle');
		expect(session.getOpenResult()).toBeUndefined();
	});
	it('reports an unavailable backend and recovers on recheck', async () => {
		const { session, raw, setBackend, setState } = setup({ backend: null });
		setState('READY');
		await session.whenSettled();
		expect(session.getStatus()).toBe('unavailable');
		setBackend(raw);
		session.recheck();
		await session.whenSettled();
		expect(session.getStatus()).toBe('ready');
	});
	it.each(['locked', 'rejected'] as const)('does not restore a stale %s outcome after stop or user switch', async (outcome) => {
		const { session, raw, setState, state } = setup();
		const held = deferred<E2EESearchOpenResult>();
		raw.open.mockReturnValueOnce(held.promise);
		setState('READY');
		await waitForCall(raw.open);
		setState('NOT_STARTED');
		state.userId = 'u2';
		if (outcome === 'locked') held.resolve({ ...opened, locked: true });
		else held.reject(new Error('old open failed'));
		await session.whenSettled();
		expect(session.getStatus()).toBe('idle');
		expect(session.getOpenResult()).toBeUndefined();
		expect(session.getActiveBackend()).toBeUndefined();
	});
	it('does not activate before a delayed open resolves', async () => {
		const { session, raw, setState } = setup();
		const held = deferred<E2EESearchOpenResult>();
		raw.open.mockReturnValueOnce(held.promise);
		setState('READY');
		await waitForCall(raw.open);
		expect(session.getActiveBackend()).toBeUndefined();
		held.resolve(opened);
		await session.whenSettled();
		expect(session.getActiveBackend()).toBeDefined();
	});
	it('closes a stale open before opening a newer login', async () => {
		const { session, raw, setState, state } = setup();
		const held = deferred<E2EESearchOpenResult>();
		raw.open.mockReturnValueOnce(held.promise);
		setState('READY');
		await waitForCall(raw.open);
		setState('DISABLED');
		state.userId = 'u2';
		setState('READY');
		held.resolve(opened);
		await session.whenSettled();
		expect(raw.open.mock.calls.map(([scope]) => scope.userId)).toEqual(['u1', 'u2']);
		expect(raw.close).toHaveBeenCalledTimes(1);
		expect(raw.close.mock.invocationCallOrder[0]).toBeLessThan(raw.open.mock.invocationCallOrder[1]);
		expect(session.getActiveBackend()).toBeDefined();
	});
	it('does not activate a delayed open after a user changes without a state event', async () => {
		const { session, raw, setState, state } = setup();
		const held = deferred<E2EESearchOpenResult>();
		raw.open.mockReturnValueOnce(held.promise);
		setState('READY');
		await waitForCall(raw.open);
		state.userId = 'u2';
		held.resolve(opened);
		await session.whenSettled();
		expect(session.getActiveBackend()).toBeUndefined();
		expect(raw.close).toHaveBeenCalledTimes(1);
	});
	it('does not open a new user from an old queued READY event', async () => {
		const { session, raw, setState, state } = setup();
		setState('READY');
		state.userId = 'u2';
		await session.whenSettled();
		expect(raw.open).not.toHaveBeenCalled();
	});
	it('revokes old handles and event callbacks immediately on a user change', async () => {
		const { session, raw, setState, state } = setup();
		setState('READY');
		await session.whenSettled();
		const previous = session.getActiveBackend()!;
		const listener = jest.fn();
		previous.onIndexEvent!(listener);
		const callback = raw.onIndexEvent.mock.calls[0][0];
		state.userId = 'u2';
		expect(session.getActiveBackend()).toBeUndefined();
		callback({ type: 'lost' });
		await expect(previous.upsert([])).rejects.toThrow('session has ended');
		await expect(previous.wipe()).rejects.toThrow('session has ended');
		expect(listener).not.toHaveBeenCalled();
		expect(raw.upsert).not.toHaveBeenCalled();
		expect(raw.wipe).not.toHaveBeenCalled();
		setState('READY');
		await session.whenSettled();
		expect(session.getActiveBackend()).not.toBe(previous);
	});
	it('rejects a delayed result from a revoked session', async () => {
		const { session, raw, setState } = setup();
		setState('READY');
		await session.whenSettled();
		const held = deferred<string[]>();
		raw.listRooms.mockReturnValueOnce(held.promise);
		const result = session.getActiveBackend()!.listRooms();
		setState('DISABLED');
		held.resolve(['r1']);
		await expect(result).rejects.toThrow('session has ended');
		await session.whenSettled();
	});
	it('closes on logout without deleting and creates a new handle at login', async () => {
		const { session, raw, setState } = setup();
		setState('READY');
		await session.whenSettled();
		const previous = session.getActiveBackend();
		setState('DISABLED');
		expect(session.getActiveBackend()).toBeUndefined();
		await session.whenSettled();
		expect(raw.close).toHaveBeenCalledTimes(1);
		expect(raw.wipe).not.toHaveBeenCalled();
		setState('READY');
		await session.whenSettled();
		expect(session.getActiveBackend()).not.toBe(previous);
	});
	it('retries a locked open without closing or writing', async () => {
		const { session, raw, setState } = setup();
		raw.open.mockResolvedValueOnce({ ...opened, locked: true });
		setState('READY');
		await session.whenSettled();
		expect(session.getActiveBackend()).toBeUndefined();
		expect(raw.close).not.toHaveBeenCalled();
		expect(raw.wipe).not.toHaveBeenCalled();
		setState('READY');
		await session.whenSettled();
		expect(session.getActiveBackend()).toBeDefined();
	});
	it.each(['key', 'backend', 'user'] as const)('does not open without a %s', async (missing) => {
		const { session, raw, setState, state } = setup({
			key: missing === 'key' ? null : privateKey,
			backend: missing === 'backend' ? null : undefined,
		});
		if (missing === 'user') state.userId = undefined;
		setState('READY');
		await session.whenSettled();
		expect(raw.open).not.toHaveBeenCalled();
	});
	it('reports open errors and retries on the next READY', async () => {
		const { session, raw, setState, onError } = setup();
		const error = new Error('open failed');
		raw.open.mockRejectedValueOnce(error);
		setState('READY');
		await session.whenSettled();
		expect(session.getActiveBackend()).toBeUndefined();
		expect(onError).toHaveBeenCalledWith(error);
		expect(session.getStatus()).toBe('unavailable');
		setState('READY');
		await session.whenSettled();
		expect(session.getActiveBackend()).toBeDefined();
		expect(session.getStatus()).toBe('ready');
	});
	it('reports close errors but keeps ended handles revoked', async () => {
		const { session, raw, setState, onError } = setup();
		setState('READY');
		await session.whenSettled();
		const previous = session.getActiveBackend()!;
		const error = new Error('close failed');
		raw.close.mockRejectedValueOnce(error);
		setState('DISABLED');
		await session.whenSettled();
		expect(onError).toHaveBeenCalledWith(error);
		expect(session.getActiveBackend()).toBeUndefined();
		await expect(previous.stats()).rejects.toThrow('session has ended');
	});
	it('notifies subscribers for activation and revocation and permits unsubscribe', async () => {
		const { session, setState } = setup();
		const listener = jest.fn();
		const off = session.subscribe(listener);
		setState('READY');
		await session.whenSettled();
		setState('DISABLED');
		await session.whenSettled();
		expect(listener).toHaveBeenCalledTimes(3);
		off();
		setState('READY');
		await session.whenSettled();
		expect(listener).toHaveBeenCalledTimes(3);
	});
	it.each([true, false])('closes and never activates after dispose during a pending open=%p', async (inFlight) => {
		const { session, raw, setState, off } = setup();
		const held = deferred<E2EESearchOpenResult>();
		if (inFlight) raw.open.mockReturnValueOnce(held.promise);
		setState('READY');
		if (inFlight) await waitForCall(raw.open);
		else await session.whenSettled();
		session.dispose();
		held.resolve(opened);
		await session.whenSettled();
		setState('READY');
		session.recheck();
		await session.whenSettled();
		expect(session.getActiveBackend()).toBeUndefined();
		expect(raw.close).toHaveBeenCalledTimes(1);
		expect(off).toHaveBeenCalledTimes(1);
	});
});

describe('permission changes', () => {
	it('wipes once while locked and never opens without permission', async () => {
		const { session, raw, setState } = setup({ allowed: false, key: null });
		setState('LOADING_KEYS');
		setState('ENTER_PASSWORD');
		session.recheck();
		await session.whenSettled();
		expect(raw.wipe).toHaveBeenCalledTimes(1);
		expect(raw.wipe).toHaveBeenCalledWith({ userId: 'u1' });
		expect(raw.open).not.toHaveBeenCalled();
	});
	it('does not delete at DISABLED before settings load', async () => {
		const { session, raw, setState } = setup({ allowed: false });
		setState('DISABLED');
		session.recheck();
		await session.whenSettled();
		expect(raw.wipe).not.toHaveBeenCalled();
	});
	it('deletes a locked index on opt-out after ERROR', async () => {
		const { session, raw, setState, state } = setup({ key: null });
		setState('ERROR');
		state.allowed = false;
		session.recheck();
		await session.whenSettled();
		expect(raw.wipe).toHaveBeenCalledWith({ userId: 'u1' });
	});
	it('opens only after a delayed disallowed wipe finishes and permission becomes allowed', async () => {
		const { session, raw, setState, state } = setup({ allowed: false });
		const held = deferred<void>();
		raw.wipe.mockReturnValueOnce(held.promise);
		setState('READY');
		await waitForCall(raw.wipe);
		state.allowed = true;
		session.recheck();
		expect(raw.open).not.toHaveBeenCalled();
		held.resolve();
		await session.whenSettled();
		expect(session.getActiveBackend()).toBeDefined();
		expect(raw.wipe.mock.invocationCallOrder[0]).toBeLessThan(raw.open.mock.invocationCallOrder[0]);
	});
	it('serializes withdrawal and reopening after a rapid permission change', async () => {
		const { session, raw, setState, state } = setup();
		setState('READY');
		await session.whenSettled();
		const previous = session.getActiveBackend()!;
		const held = deferred<void>();
		raw.wipe.mockReturnValueOnce(held.promise);
		state.allowed = false;
		session.recheck();
		expect(session.getActiveBackend()).toBeUndefined();
		state.allowed = true;
		session.recheck();
		await waitForCall(raw.wipe);
		expect(raw.open).toHaveBeenCalledTimes(1);
		await expect(previous.upsert([])).rejects.toThrow('session has ended');
		held.resolve();
		await session.whenSettled();
		expect(raw.open).toHaveBeenCalledTimes(2);
		expect(raw.wipe).toHaveBeenCalledWith({ userId: 'u1' });
		expect(session.getActiveBackend()).toBeDefined();
	});
	it('does not lose a withdrawal while open is delayed and permission changes twice', async () => {
		const { session, raw, setState, state } = setup();
		const held = deferred<E2EESearchOpenResult>();
		raw.open.mockReturnValueOnce(held.promise);
		setState('READY');
		await waitForCall(raw.open);
		state.allowed = false;
		session.recheck();
		state.allowed = true;
		session.recheck();
		held.resolve(opened);
		await session.whenSettled();
		expect(raw.wipe).toHaveBeenCalledWith({ userId: 'u1' });
		expect(raw.close).toHaveBeenCalledTimes(1);
		expect(raw.open).toHaveBeenCalledTimes(2);
		expect(session.getActiveBackend()).toBeDefined();
	});
	it.each([true, false])('wipes an open result after permission changes without recheck, locked=%p', async (locked) => {
		const { session, raw, setState, state } = setup();
		const held = deferred<E2EESearchOpenResult>();
		raw.open.mockReturnValueOnce(held.promise);
		setState('READY');
		await waitForCall(raw.open);
		state.allowed = false;
		held.resolve({ ...opened, ...(locked && { locked: true as const }) });
		await session.whenSettled();
		expect(session.getActiveBackend()).toBeUndefined();
		expect(raw.wipe).toHaveBeenCalledWith({ userId: 'u1' });
	});
	it('finishes the old user wipe before opening the new user', async () => {
		const { session, raw, setState, state } = setup();
		setState('READY');
		await session.whenSettled();
		const held = deferred<void>();
		raw.wipe.mockReturnValueOnce(held.promise);
		state.allowed = false;
		session.recheck();
		await waitForCall(raw.wipe);
		state.userId = 'u2';
		state.allowed = true;
		setState('READY');
		expect(raw.open).toHaveBeenCalledTimes(1);
		held.resolve();
		await session.whenSettled();
		expect(raw.wipe).toHaveBeenCalledWith({ userId: 'u1' });
		expect(raw.open.mock.calls[1][0].userId).toBe('u2');
		expect(session.getActiveBackend()).toBeDefined();
	});
	it('ignores a locked wipe queued for a previous user', async () => {
		const { session, raw, setState, state } = setup({ allowed: false, key: null });
		const held = deferred<void>();
		raw.wipe.mockReturnValueOnce(held.promise);
		setState('ENTER_PASSWORD');
		await waitForCall(raw.wipe);
		session.recheck();
		state.userId = 'u2';
		held.resolve();
		await session.whenSettled();
		expect(raw.wipe).toHaveBeenCalledTimes(1);
		expect(raw.wipe).toHaveBeenCalledWith({ userId: 'u1' });
	});
	it('reports a failed wipe and retries without activation', async () => {
		const { session, raw, setState, onError } = setup({ allowed: false });
		const error = new Error('wipe failed');
		raw.wipe.mockRejectedValueOnce(error);
		setState('READY');
		await session.whenSettled();
		expect(onError).toHaveBeenCalledWith(error);
		expect(session.getActiveBackend()).toBeUndefined();
		session.recheck();
		await session.whenSettled();
		expect(raw.wipe).toHaveBeenCalledTimes(2);
		expect(raw.open).not.toHaveBeenCalled();
	});
});
