import type { E2EESearchOpenResult, ISearchIndexBackend } from '@rocket.chat/desktop-api';

import { createSearchIndexSessionBackend } from './searchIndexSessionBackend';

const WRAP_KEY_LABEL = 'Rocket.Chat E2EE search index wrap key v1';
const textEncoder = new TextEncoder();

/** Derive a stable sealing key without passing the private key to the backend. */
export const deriveSearchIndexWrapKey = async (privateKey: CryptoKey, userId: string): Promise<Uint8Array> => {
	const { d } = await crypto.subtle.exportKey('jwk', privateKey);
	if (!d) throw new Error('The E2EE private key has no private exponent');

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

export type SearchIndexSessionSource = {
	on(type: 'E2E_STATE_CHANGED', handler: (change: E2EEStateChange) => void): () => void;
	getUserId(): string | undefined;
	getPrivateKey(): CryptoKey | undefined;
};

type SearchIndexSessionOptions = {
	getBackend: () => ISearchIndexBackend | undefined;
	isAllowed?: () => boolean;
	onError?: (error: unknown) => void;
};

export type SearchIndexSessionStatus = 'idle' | 'opening' | 'ready' | 'locked' | 'unavailable' | 'unsupported';

export type SearchIndexSession = {
	getStatus(): SearchIndexSessionStatus;
	getActiveBackend(): ISearchIndexBackend | undefined;
	getOpenResult(): E2EESearchOpenResult | undefined;
	isEncryptedAtRest(): boolean | undefined;
	subscribe(listener: () => void): () => void;
	recheck(): void;
	/** Revoke access before a scoped reset wipe, including when E2EE is locked. */
	wipeClosed(beforeWipe?: () => Promise<void>): Promise<boolean>;
	whenSettled(): Promise<void>;
	dispose(): void;
};

const readyStates = new Set(['READY', 'SAVE_PASSWORD']);
const stoppedStates = new Set(['DISABLED', 'NOT_STARTED', 'ERROR']);

type ActiveIndex = ReturnType<typeof createSearchIndexSessionBackend> & {
	raw: ISearchIndexBackend;
	userId: string;
	opened: E2EESearchOpenResult;
};

const supportsSession = (backend: ISearchIndexBackend, opened: E2EESearchOpenResult): boolean =>
	opened.capabilities?.recentCursor === 1 &&
	opened.capabilities.lifecycleEvents === 1 &&
	opened.capabilities.close === 1 &&
	typeof backend.searchRecentPage === 'function' &&
	typeof backend.onIndexEvent === 'function' &&
	typeof backend.close === 'function';

/** Serialize index access and deletion without transferring work between users or open sessions. */
export const createSearchIndexSession = (
	source: SearchIndexSessionSource,
	{ getBackend, isAllowed = () => false, onError = () => undefined }: SearchIndexSessionOptions,
): SearchIndexSession => {
	let generation = 0;
	let disposed = false;
	let ready = false;
	let started = false;
	let observedUser = source.getUserId();
	let openedFor: string | undefined;
	let wipedFor: string | undefined;
	let active: ActiveIndex | undefined;
	let openResult: E2EESearchOpenResult | undefined;
	let status: SearchIndexSessionStatus = 'idle';
	let opening: { raw: ISearchIndexBackend; userId: string } | undefined;
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

	const setActive = (
		next: ActiveIndex | undefined,
		reported = next?.opened,
		nextStatus: SearchIndexSessionStatus = next ? 'ready' : 'idle',
	) => {
		if (active === next && openResult === reported && status === nextStatus) return;
		const previous = active;
		active = next;
		openResult = reported;
		status = nextStatus;
		try {
			previous?.revoke();
		} catch (error) {
			onError(error);
		}
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

	const stopAndClose = () => {
		ready = false;
		started = false;
		wipedFor = undefined;
		const closing = active?.raw;
		stop();
		if (closing) void serialize(() => close(closing));
	};

	const checkUser = () => {
		const userId = source.getUserId();
		if (observedUser !== userId) {
			observedUser = userId;
			stopAndClose();
		}
	};

	const isCurrent = (run: number, userId: string) => !disposed && run === generation && source.getUserId() === userId;

	const start = async (run: number, userId: string | undefined, privateKey: CryptoKey | undefined) => {
		if (!userId || !isCurrent(run, userId) || openedFor === userId) return;
		if (!privateKey) {
			if (isAllowed()) setActive(undefined, undefined, 'locked');
			return;
		}
		const backend = getBackend();
		if (!backend) {
			if (isAllowed()) setActive(undefined, undefined, 'unavailable');
			return;
		}
		openedFor = userId;
		const attempt = { raw: backend, userId };
		opening = attempt;
		try {
			if (!isAllowed()) {
				setActive(undefined);
				await backend.wipe({ userId });
				if (!isCurrent(run, userId)) return;
				wipedFor = userId;
				if (!isAllowed()) {
					openedFor = undefined;
					return;
				}
			}

			setActive(undefined, undefined, 'opening');
			const wrapKey = await deriveSearchIndexWrapKey(privateKey, userId);
			if (!isCurrent(run, userId)) return;
			if (!isAllowed()) {
				openedFor = undefined;
				setActive(undefined);
				await backend.wipe({ userId });
				return;
			}

			const opened = await backend.open({ userId, wrapKey });
			if (!isCurrent(run, userId)) {
				if (!opened.locked) await close(backend);
				return;
			}
			if (!isAllowed()) {
				openedFor = undefined;
				setActive(undefined);
				await backend.wipe({ userId });
				wipedFor = userId;
				return;
			}
			if (opened.locked) {
				openedFor = undefined;
				setActive(undefined, opened, 'locked');
				return;
			}
			if (!supportsSession(backend, opened)) {
				openedFor = undefined;
				setActive(undefined, opened, 'unsupported');
				await close(backend);
				return;
			}

			wipedFor = undefined;
			setActive({ ...createSearchIndexSessionBackend(backend), raw: backend, userId, opened });
		} catch (error) {
			if (isCurrent(run, userId)) {
				openedFor = undefined;
				setActive(undefined, undefined, isAllowed() ? 'unavailable' : 'idle');
			}
			onError(error);
		} finally {
			if (opening === attempt) opening = undefined;
		}
	};

	const queueStart = () => {
		const run = generation;
		const userId = source.getUserId();
		const privateKey = source.getPrivateKey();
		void serialize(() => start(run, userId, privateKey));
	};

	const wipeIfNotAllowed = async (run: number, userId: string | undefined) => {
		if (!userId || !isCurrent(run, userId) || active || wipedFor === userId || isAllowed()) return;
		const backend = getBackend();
		if (!backend) return;
		wipedFor = userId;
		try {
			await backend.wipe({ userId });
		} catch (error) {
			if (isCurrent(run, userId)) wipedFor = undefined;
			onError(error);
		}
	};

	const queueDisallowedWipe = () => {
		const run = generation;
		const userId = source.getUserId();
		void serialize(() => wipeIfNotAllowed(run, userId));
	};

	const off = source.on('E2E_STATE_CHANGED', ({ nextState }) => {
		if (disposed) return;
		checkUser();
		if (readyStates.has(nextState)) {
			ready = true;
			started = true;
			queueStart();
			return;
		}
		if (stoppedStates.has(nextState)) {
			stopAndClose();
			if (nextState === 'ERROR') started = true;
			return;
		}
		started = true;
		queueDisallowedWipe();
	});

	const getActive = () => {
		checkUser();
		return active;
	};

	return {
		getStatus: () => {
			checkUser();
			return status;
		},
		getActiveBackend: () => getActive()?.backend,
		getOpenResult: () => {
			checkUser();
			return openResult;
		},
		isEncryptedAtRest: () => getActive()?.opened.encryptedAtRest,
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		recheck: () => {
			if (disposed) return;
			checkUser();
			const withdrawn = active ?? (opening?.userId === source.getUserId() ? opening : undefined);
			if (withdrawn && !isAllowed()) {
				const { raw, userId } = withdrawn;
				opening = undefined;
				stop();
				void serialize(async () => {
					try {
						await raw.wipe({ userId });
					} catch (error) {
						onError(error);
					}
				});
				return;
			}
			if (ready) {
				if (!openedFor) queueStart();
				return;
			}
			if (!started) return;
			if (isAllowed()) {
				wipedFor = undefined;
				return;
			}
			queueDisallowedWipe();
		},
		wipeClosed: (beforeWipe) => {
			if (disposed) return Promise.resolve(false);
			checkUser();
			const userId = source.getUserId();
			const backend = active?.raw ?? (opening && opening.userId === userId ? opening.raw : undefined) ?? getBackend();
			if (!userId || !backend) return Promise.resolve(false);
			ready = false;
			stop();
			return serialize(async () => {
				await beforeWipe?.();
				await backend.wipe({ userId });
				return true;
			});
		},
		whenSettled: () => pending,
		dispose: () => {
			if (disposed) return;
			disposed = true;
			off();
			stopAndClose();
			listeners.clear();
		},
	};
};
