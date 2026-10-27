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
	 * Whether the workspace admin allows the local search of encrypted messages, read at each login. When it does not,
	 * the session wipes the index of the user and does not use it.
	 */
	isAllowed?: () => boolean;
	onError?: (error: unknown) => void;
};

export type SearchIndexSession = {
	/** The backend after its `open` resolved for the current user, or `undefined` before that and after a logout. */
	getActiveBackend(): ISearchIndexBackend | undefined;
	/** Calls the listener each time `getActiveBackend` changes. Returns the function that removes it. */
	subscribe(listener: () => void): () => void;
	/** Resolves when the open that runs now (if any) has settled. */
	whenSettled(): Promise<void>;
	dispose(): void;
};

const readyStates = new Set(['READY', 'SAVE_PASSWORD']);

/** E2EE is off in these states. `stopClient` (logout) ends in `DISABLED`. Key loading in between keeps the index. */
const stoppedStates = new Set(['DISABLED', 'NOT_STARTED', 'ERROR']);

/**
 * Opens the local search index for the logged-in user when E2EE is unlocked, with the wrap key derived from the
 * private key, or wipes it when the workspace does not allow the local search, and stops using it when E2EE stops (logout, E2EE disabled, key error). An open that resolves after
 * the session stopped does not activate the backend.
 */
export const createSearchIndexSession = (
	source: SearchIndexSessionSource,
	{ getBackend, isAllowed = () => true, onError = () => undefined }: SearchIndexSessionOptions,
): SearchIndexSession => {
	let generation = 0;
	let openedFor: string | undefined;
	let active: ISearchIndexBackend | undefined;
	let pending: Promise<void> = Promise.resolve();
	const listeners = new Set<() => void>();

	const setActive = (backend: ISearchIndexBackend | undefined) => {
		if (active === backend) return;
		active = backend;
		for (const listener of [...listeners]) listener();
	};

	const stop = () => {
		generation++;
		openedFor = undefined;
		setActive(undefined);
	};

	const start = async (run: number) => {
		const userId = source.getUserId();
		const privateKey = source.getPrivateKey();
		if (!userId || !privateKey) return;
		if (openedFor === userId) return;

		const backend = getBackend();
		if (!backend) return;

		openedFor = userId;
		try {
			const wrapKey = await deriveSearchIndexWrapKey(privateKey, userId);
			if (run !== generation) return;

			await backend.open({ userId, wrapKey });
			if (run !== generation) return;

			if (!isAllowed()) {
				// The admin turned the local search off: no index of this user stays on the device.
				openedFor = undefined;
				await backend.wipe();
				return;
			}

			setActive(backend);
		} catch (error) {
			if (run === generation) openedFor = undefined;
			onError(error);
		}
	};

	const off = source.on('E2E_STATE_CHANGED', ({ nextState }) => {
		if (readyStates.has(nextState)) {
			pending = start(generation);
			return;
		}

		if (stoppedStates.has(nextState)) stop();
	});

	return {
		getActiveBackend: () => active,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		whenSettled: () => pending,
		dispose: () => {
			off();
			stop();
		},
	};
};
