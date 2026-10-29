import type { ISearchIndexBackend } from '@rocket.chat/desktop-api';

/** Changes this label only with a new index schema: a new label makes every sealed index unreadable. */
const WRAP_KEY_LABEL = 'Rocket.Chat E2EE search index wrap key v1';

const textEncoder = new TextEncoder();

/**
 * Derives the 32-byte key that seals the local search index from the user's E2EE private key (HKDF-SHA-256 over the
 * private exponent, with a fixed label and the user ID). The same key and user always give the same bytes, so the
 * index opens again after a logout. The private key itself never leaves this function.
 */
export const deriveSearchIndexWrapKey = async (privateKey: CryptoKey, userId: string): Promise<Uint8Array> => {
	const { d } = await crypto.subtle.exportKey('jwk', privateKey);
	if (!d) {
		throw new Error('The E2EE private key has no private exponent');
	}

	const material = await crypto.subtle.importKey('raw', textEncoder.encode(d), 'HKDF', false, ['deriveBits']);
	const bits = await crypto.subtle.deriveBits(
		{
			name: 'HKDF',
			hash: 'SHA-256',
			salt: textEncoder.encode(WRAP_KEY_LABEL),
			info: textEncoder.encode(userId),
		},
		material,
		256,
	);

	return new Uint8Array(bits);
};

type E2EEStateChange = { prevState: string; nextState: string };

/** The part of the E2EE client that the search index session reads. */
export type SearchIndexSessionSource = {
	on(type: 'E2E_STATE_CHANGED', handler: (change: E2EEStateChange) => void): () => void;
	getUserId(): string | undefined;
	getPrivateKey(): CryptoKey | undefined;
};

type SearchIndexSessionOptions = {
	getBackend: () => ISearchIndexBackend | undefined;
	/**
	 * Whether the local search of encrypted messages is allowed (the workspace admin's setting and the user's opt-in on
	 * this device), read at each login and at each `recheck`. When it is not, the session wipes the index of the user
	 * without opening it, and does not use it.
	 */
	isAllowed?: () => boolean;
	onError?: (error: unknown) => void;
};

export type SearchIndexSession = {
	/** The backend after its `open` resolved for the current user, or `undefined` before that and after a logout. */
	getActiveBackend(): ISearchIndexBackend | undefined;
	/**
	 * Whether the active index is encrypted on disk, as its `open` reported. `false` when the desktop app keeps the index in
	 * memory only (Linux with no key store). `undefined` while no index is active.
	 */
	isEncryptedAtRest(): boolean | undefined;
	/** Calls the listener each time `getActiveBackend` changes. Returns the function that removes it. */
	subscribe(listener: () => void): () => void;
	/**
	 * Reads `isAllowed` again now, without a new login: wipes and stops using the open index when it is not allowed any
	 * more, or opens the index when it became allowed while E2EE is ready.
	 */
	recheck(): void;
	/**
	 * Deletes the index of the logged-in user while no index is open (E2EE is locked), after the user reset the own E2E
	 * key: the new key cannot open the old index. Resolves `false` when there is no user or no backend.
	 */
	wipeClosed(): Promise<boolean>;
	/** Resolves when the open or wipe that runs now (if any) has settled. */
	whenSettled(): Promise<void>;
	dispose(): void;
};

const readyStates = new Set(['READY', 'SAVE_PASSWORD']);

/** E2EE is off in these states. `stopClient` (logout) ends in `DISABLED`. Key loading in between keeps the index. */
const stoppedStates = new Set(['DISABLED', 'NOT_STARTED', 'ERROR']);

const backendMethods = [
	'open',
	'upsert',
	'remove',
	'removeRoom',
	'listRooms',
	'search',
	'getRoomState',
	'setRoomState',
	'stats',
	'wipe',
	'close',
] as const satisfies readonly (keyof ISearchIndexBackend)[];

type BackendCall = (...args: unknown[]) => Promise<unknown>;

/** The backend of one open of the index. After `revoke`, each call rejects, so work of an ended session reaches no index. */
const createSessionBackend = (backend: ISearchIndexBackend) => {
	let revoked = false;
	const forward =
		(call: BackendCall): BackendCall =>
		(...args) =>
			revoked ? Promise.reject(new Error('The E2EE search index session has ended')) : call.apply(backend, args);
	const handle: Partial<Record<(typeof backendMethods)[number], BackendCall>> = {};
	for (const method of backendMethods) {
		const call = backend[method] as BackendCall | undefined;
		if (typeof call === 'function') handle[method] = forward(call);
	}
	return {
		backend: handle as unknown as ISearchIndexBackend,
		revoke: () => {
			revoked = true;
		},
	};
};

type ActiveIndex = ReturnType<typeof createSessionBackend> & { raw: ISearchIndexBackend; encryptedAtRest: boolean };

/**
 * Opens the local search index for the logged-in user when E2EE is unlocked, with the wrap key derived from the
 * private key, or wipes it when the workspace does not allow the local search, and stops using it when E2EE stops
 * (logout, E2EE disabled, key error), with a close when the desktop app offers one. Each open gets its own backend
 * object, which rejects every call after the session stops using it. Opens, closes and wipes run one after the other.
 */
export const createSearchIndexSession = (
	source: SearchIndexSessionSource,
	{ getBackend, isAllowed = () => true, onError = () => undefined }: SearchIndexSessionOptions,
): SearchIndexSession => {
	let generation = 0;
	let ready = false;
	/** E2EE started for the user (keys loading, password needed or ready). It starts only after the settings loaded. */
	let started = false;
	let openedFor: string | undefined;
	/** The user whose closed index was wiped because the local search is not allowed, so each state change does not wipe again. */
	let wipedFor: string | undefined;
	let active: ActiveIndex | undefined;
	let pending: Promise<void> = Promise.resolve();
	const listeners = new Set<() => void>();

	const serialize = <T>(operation: () => Promise<T>): Promise<T> => {
		const run = pending.then(operation);
		pending = run.then(
			() => undefined,
			() => undefined,
		);
		return run;
	};

	const setActive = (next: ActiveIndex | undefined) => {
		if (active === next) return;
		active?.revoke();
		active = next;
		for (const listener of [...listeners]) listener();
	};

	const stop = () => {
		generation++;
		openedFor = undefined;
		setActive(undefined);
	};

	const close = async (backend: ISearchIndexBackend) => {
		try {
			await backend.close?.();
		} catch (error) {
			onError(error);
		}
	};

	const start = async (run: number) => {
		if (run !== generation) return;
		const userId = source.getUserId();
		const privateKey = source.getPrivateKey();
		if (!userId || !privateKey) return;
		if (openedFor === userId) return;

		const backend = getBackend();
		if (!backend) return;

		openedFor = userId;
		try {
			// No index and no key file of this user stays on the device while the local search is off, and none is created
			// for it.
			if (!isAllowed()) {
				await backend.wipe({ userId });
				if (run !== generation) return;
				if (!isAllowed()) {
					openedFor = undefined;
					return;
				}
			}

			const wrapKey = await deriveSearchIndexWrapKey(privateKey, userId);
			if (run !== generation) return;

			const opened = await backend.open({ userId, wrapKey });
			if (run !== generation) {
				// The session stopped (logout) while the open ran: the index of that user does not stay open.
				if (!opened.locked) await close(backend);
				return;
			}

			// The desktop app did not take the wrap key: no index is open, so the session does not use it.
			if (opened.locked) {
				openedFor = undefined;
				return;
			}

			if (!isAllowed()) {
				// The admin turned the local search off: no index of this user stays on the device.
				openedFor = undefined;
				await backend.wipe();
				return;
			}

			wipedFor = undefined;
			setActive({ ...createSessionBackend(backend), raw: backend, encryptedAtRest: opened.encryptedAtRest });
		} catch (error) {
			if (run === generation) openedFor = undefined;
			onError(error);
		}
	};

	/** Wipes the closed index of the user when the local search is not allowed, also while E2EE stays locked. */
	const wipeIfNotAllowed = async () => {
		const userId = source.getUserId();
		if (!userId || active || wipedFor === userId || isAllowed()) return;

		const backend = getBackend();
		if (!backend) return;

		wipedFor = userId;
		try {
			await backend.wipe({ userId });
		} catch (error) {
			wipedFor = undefined;
			onError(error);
		}
	};

	const withdraw = async (backend: ISearchIndexBackend) => {
		try {
			await backend.wipe();
		} catch (error) {
			onError(error);
		}
	};

	/** Another user logged in on the same page with no logout (`loginWithToken`), so the index is not of the current user. */
	const isOtherUser = () => openedFor !== undefined && source.getUserId() !== openedFor;

	const stopAndClose = () => {
		ready = false;
		started = false;
		wipedFor = undefined;
		const closing = active?.raw;
		stop();
		if (closing?.close) void serialize(() => close(closing));
	};

	const off = source.on('E2E_STATE_CHANGED', ({ nextState }) => {
		// The index of the previous user closes, like at a logout, before the index of the new user opens.
		if (isOtherUser()) stopAndClose();

		if (readyStates.has(nextState)) {
			ready = true;
			started = true;
			const run = generation;
			void serialize(() => start(run));
			return;
		}

		if (stoppedStates.has(nextState)) {
			stopAndClose();
			return;
		}

		// E2EE started but is locked (keys loading, password needed). Unlike `DISABLED`, which also comes before the first
		// settings arrive, these states come after the settings loaded, so `isAllowed` is reliable here.
		started = true;
		void serialize(wipeIfNotAllowed);
	});

	return {
		// From the user switch until the next E2EE state change, the index of the previous user is not used.
		getActiveBackend: () => (isOtherUser() ? undefined : active?.backend),
		isEncryptedAtRest: () => (isOtherUser() ? undefined : active?.encryptedAtRest),
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		recheck: () => {
			if (active) {
				if (isAllowed()) return;
				const withdrawn = active.raw;
				stop();
				void serialize(() => withdraw(withdrawn));
				return;
			}

			// An open in flight reads `isAllowed` itself when it resolves.
			if (ready) {
				if (!openedFor) {
					const run = generation;
					void serialize(() => start(run));
				}
				return;
			}

			if (!started) return;
			if (isAllowed()) {
				wipedFor = undefined;
				return;
			}
			void serialize(wipeIfNotAllowed);
		},
		wipeClosed: () => {
			const userId = source.getUserId();
			const backend = getBackend();
			if (!userId || !backend) return Promise.resolve(false);

			// An open that resolves after this point does not activate the backend.
			stop();
			return serialize(async () => {
				await backend.wipe({ userId });
				return true;
			});
		},
		whenSettled: () => pending,
		dispose: () => {
			off();
			stop();
		},
	};
};
