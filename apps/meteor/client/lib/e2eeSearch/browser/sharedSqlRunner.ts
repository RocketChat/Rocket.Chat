import type { SqlIndexEvent, SqlRow, SqlRunner, SqlScopeState, SqlStatement } from './workerSqlRunner';

type Request =
	| { op: 'open'; scopeId: string; keyId: string }
	| { op: 'exec'; scopeId?: string; keyId?: string; statement: SqlStatement }
	| { op: 'batch'; scopeId?: string; keyId?: string; statements: SqlStatement[] }
	| { op: 'flush'; scopeId?: string; keyId?: string }
	| { op: 'wipe'; scopeId: string; keyId?: string }
	| { op: 'close'; scopeId: string; keyId?: string };

type Message =
	| { kind: 'request'; from: string; id: number; request: Request }
	| { kind: 'reply'; to: string; id: number; rows?: SqlRow[]; error?: string }
	| { kind: 'leader'; from: string }
	| { kind: 'event'; scopeId: string; keyId: string; type: 'lost' | 'changed' };

export type SharedSqlRunner = SqlRunner & {
	/** True when this tab owns the worker and the copy on disk. */
	isLeader(): boolean;
};

const CALL_TIMEOUT_MS = 30_000;

const KEY_ID_LABEL = 'Rocket.Chat E2EE search browser index key id v1';

/** Identify matching wrap keys without exposing them. */
const keyIdOf = async (wrapKey: CryptoKey): Promise<string> => {
	const label = new TextEncoder().encode(KEY_ID_LABEL);
	const macKey = await crypto.subtle.deriveKey(
		{ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: label },
		wrapKey,
		{ name: 'HMAC', hash: 'SHA-256', length: 256 },
		false,
		['sign'],
	);
	const mac = new Uint8Array(await crypto.subtle.sign('HMAC', macKey, label));
	return Array.from(mac, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const canShare = (): boolean =>
	typeof navigator !== 'undefined' && typeof navigator.locks?.request === 'function' && typeof BroadcastChannel === 'function';

/** Share one writer across tabs without sending the wrap key over the channel. */
export const createSharedSqlRunner = (name: string, createLocal: () => SqlRunner): SharedSqlRunner => {
	if (!canShare()) {
		const local = createLocal();
		return { ...local, isLeader: () => true };
	}

	const self = crypto.randomUUID();
	const pending = new Map<
		number,
		{ request: Request; resolve: (rows: SqlRow[]) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }
	>();
	let nextId = 0;
	let channel: BroadcastChannel | undefined;
	let local: SqlRunner | undefined;
	let unsubscribeLocal: (() => void) | undefined;
	const listeners = new Set<(event: SqlIndexEvent) => void>();
	const notify = (event: SqlIndexEvent) => {
		if (event.scopeId === tabScope) for (const listener of listeners) listener(event);
	};
	const announce = (event: SqlIndexEvent) => {
		notify(event);
		if (tabKey && tabKey.scopeId === event.scopeId)
			channel?.postMessage({ kind: 'event', ...event, keyId: tabKey.keyId } satisfies Message);
	};
	let localScope: string | undefined;
	let tabScope: string | undefined;
	let tabKey: { scopeId: string; wrapKey: CryptoKey; keyId: string; schema?: string } | undefined;
	const tabKeyId = () => (tabScope !== undefined && tabKey?.scopeId === tabScope ? tabKey.keyId : undefined);
	const sameKey = (scopeId: string, keyId: string | undefined) =>
		keyId !== undefined && tabKey?.scopeId === scopeId && tabKey.keyId === keyId;
	const openLocal = (runner: SqlRunner, scopeId: string) => {
		const own = tabKey?.scopeId === scopeId ? tabKey : undefined;
		return runner.open(scopeId, own?.wrapKey, own?.schema);
	};
	// Scope checks and SQL must not interleave with another request.
	let serving: Promise<unknown> = Promise.resolve();

	const runLocal = async (request: Request, own: boolean): Promise<SqlRow[]> => {
		if (!local) {
			local = createLocal();
			unsubscribeLocal = local.onIndexEvent?.(announce);
		}
		if (request.op === 'open') {
			if (!own && !sameKey(request.scopeId, request.keyId)) {
				const locked: SqlScopeState = { persistent: false, restored: false, locked: true };
				return [locked as unknown as SqlRow];
			}
			localScope = undefined;
			const state = await openLocal(local, request.scopeId);
			localScope = state.locked ? undefined : request.scopeId;
			return [state as unknown as SqlRow];
		}
		if (request.op === 'wipe') {
			if (!own && !sameKey(request.scopeId, request.keyId)) throw new Error('E2EE search index is locked');
			await local.wipe(request.scopeId);
			announce({ scopeId: request.scopeId, type: 'lost' });
			if (localScope === request.scopeId) localScope = undefined;
			return [];
		}
		if (request.op === 'close') {
			if (!own && !sameKey(request.scopeId, request.keyId)) return [];
			if (!own && tabScope === request.scopeId) {
				if (localScope === request.scopeId) await local.flush();
				return [];
			}
			await local.close(request.scopeId);
			if (localScope === request.scopeId) localScope = undefined;
			return [];
		}
		if (request.scopeId === undefined) throw new Error('E2EE search index is not open');
		if (!own && !sameKey(request.scopeId, request.keyId)) throw new Error('E2EE search index is locked');
		if (request.scopeId !== localScope) {
			localScope = undefined;
			const state = await openLocal(local, request.scopeId);
			if (state.locked) throw new Error('E2EE search index is locked');
			localScope = request.scopeId;
			if (!state.restored || state.evicted) announce({ scopeId: request.scopeId, type: 'lost' });
		}
		switch (request.op) {
			case 'exec':
				return local.exec(request.statement);
			case 'batch':
				await local.batch(request.statements);
				announce({ scopeId: request.scopeId, type: 'changed' });
				return [];
			case 'flush':
				await local.flush();
				return [];
		}
	};

	const serve = (request: Request, own: boolean): Promise<SqlRow[]> => {
		const result = serving.then(() => runLocal(request, own));
		serving = result.catch(() => undefined);
		return result;
	};

	let leader = false;
	let lockWait: AbortController | undefined;
	let releaseLock: (() => void) | undefined;
	let stops = 0;

	const settle = (id: number, rows: SqlRow[] | undefined, error: string | undefined) => {
		const call = pending.get(id);
		if (!call) return;
		pending.delete(id);
		clearTimeout(call.timer);
		if (error !== undefined) call.reject(new Error(error));
		else call.resolve(rows ?? []);
	};

	const runOwn = (id: number, request: Request) =>
		serve(request, true).then(
			(rows) => settle(id, rows, undefined),
			(error: unknown) => settle(id, undefined, error instanceof Error ? error.message : String(error)),
		);

	const onMessage = ({ data }: MessageEvent<Message>) => {
		if (data.kind === 'event') {
			if (sameKey(data.scopeId, data.keyId)) notify({ scopeId: data.scopeId, type: data.type });
			return;
		}
		if (data.kind === 'reply' && data.to === self) {
			settle(data.id, data.rows, data.error);
			return;
		}
		if (data.kind === 'leader') {
			for (const [id, call] of pending) channel?.postMessage({ kind: 'request', from: self, id, request: call.request } satisfies Message);
			return;
		}
		if (data.kind === 'request' && leader) {
			const { from, id, request } = data;
			serve(request, false).then(
				(rows) => channel?.postMessage({ kind: 'reply', to: from, id, rows } satisfies Message),
				(error: unknown) =>
					channel?.postMessage({
						kind: 'reply',
						to: from,
						id,
						error: error instanceof Error ? error.message : String(error),
					} satisfies Message),
			);
		}
	};

	const start = () => {
		if (channel) return;
		const started = new BroadcastChannel(name);
		channel = started;
		started.onmessage = (event) => {
			if (channel === started) onMessage(event);
		};
		lockWait = new AbortController();
		void navigator.locks
			.request(name, { signal: lockWait.signal }, () => {
				leader = true;
				for (const [id, call] of pending) void runOwn(id, call.request);
				channel?.postMessage({ kind: 'leader', from: self } satisfies Message);
				return new Promise<void>((release) => {
					releaseLock = release;
				});
			})
			.catch(() => undefined);
	};

	const stop = () => {
		lockWait?.abort();
		lockWait = undefined;
		releaseLock?.();
		releaseLock = undefined;
		channel?.close();
		channel = undefined;
		leader = false;
		stops++;
		for (const call of pending.values()) {
			clearTimeout(call.timer);
			call.reject(new Error('E2EE search index is closed'));
		}
		pending.clear();
	};

	const send = (request: Request): Promise<SqlRow[]> =>
		new Promise<SqlRow[]>((resolve, reject) => {
			start();
			const id = nextId++;
			const timer = setTimeout(
				() => settle(id, undefined, `E2EE search index did not answer the ${request.op} call in ${CALL_TIMEOUT_MS / 1000} s`),
				CALL_TIMEOUT_MS,
			);
			pending.set(id, { request, resolve, reject, timer });
			if (leader) void runOwn(id, request);
			else channel?.postMessage({ kind: 'request', from: self, id, request } satisfies Message);
		});

	return {
		onIndexEvent(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		isLeader: () => leader,
		open: async (scopeId, wrapKey, schema) => {
			if (!wrapKey) {
				tabKey = undefined;
				tabScope = undefined;
				return { persistent: false, restored: false, locked: true };
			}
			const stopsBefore = stops;
			const keyId = await keyIdOf(wrapKey);
			if (stops !== stopsBefore) throw new Error('E2EE search index is closed');
			if (tabScope !== scopeId) tabScope = undefined;
			tabKey = { scopeId, wrapKey, keyId, schema };
			const [row] = await send({ op: 'open', scopeId, keyId });
			const state = row as unknown as SqlScopeState;
			if (stops !== stopsBefore) throw new Error('E2EE search index is closed');
			if (state.locked) {
				tabKey = undefined;
				tabScope = undefined;
			} else {
				tabScope = scopeId;
			}
			return state;
		},
		exec: (statement) => send({ op: 'exec', scopeId: tabScope, keyId: tabKeyId(), statement }),
		batch: async (statements) => {
			await send({ op: 'batch', scopeId: tabScope, keyId: tabKeyId(), statements });
		},
		flush: async () => {
			await send({ op: 'flush', scopeId: tabScope, keyId: tabKeyId() });
		},
		wipe: async (scopeId) => {
			const keyId = tabKeyId();
			if (tabScope === scopeId) tabScope = undefined;
			await send({ op: 'wipe', scopeId, keyId });
			if (tabKey?.scopeId === scopeId) tabKey = undefined;
		},
		close: async (scopeId) => {
			const keyId = tabKeyId();
			if (tabScope === scopeId) tabScope = undefined;
			if (tabKey?.scopeId === scopeId) tabKey = undefined;
			try {
				if (channel) await send({ op: 'close', scopeId, keyId });
			} finally {
				unsubscribeLocal?.();
				unsubscribeLocal = undefined;
				local = undefined;
				localScope = undefined;
				stop();
			}
		},
	};
};
