import type { SqlRow, SqlRunner, SqlScopeState, SqlStatement } from './workerSqlRunner';

type Request =
	| { op: 'open'; scopeId: string }
	| { op: 'exec'; scopeId?: string; statement: SqlStatement }
	| { op: 'batch'; scopeId?: string; statements: SqlStatement[] }
	| { op: 'flush'; scopeId?: string }
	| { op: 'wipe'; scopeId: string }
	| { op: 'close'; scopeId: string };

type Message =
	| { kind: 'request'; from: string; id: number; request: Request }
	| { kind: 'reply'; to: string; id: number; rows?: SqlRow[]; error?: string }
	| { kind: 'leader'; from: string };

export type SharedSqlRunner = SqlRunner & {
	/** True when this tab owns the worker and the copy on disk. */
	isLeader(): boolean;
};

const canShare = (): boolean =>
	typeof navigator !== 'undefined' && typeof navigator.locks?.request === 'function' && typeof BroadcastChannel === 'function';

/**
 * Lets the tabs of one origin share one E2EE search index. Web Locks elect one leader tab: only that tab starts the
 * worker, so only one writer ever opens the encrypted copy on disk. The other tabs send their SQL to the leader over a
 * `BroadcastChannel` named `name`. When the leader tab closes, the lock goes to another tab, which starts its own worker
 * and opens the copy again. The calls that wait for a leader are sent again to the new one. Each call is safe to
 * repeat: an upsert replaces the row, a remove of a missing row does nothing.
 *
 * Without Web Locks or `BroadcastChannel`, each tab uses its own worker (`createLocal`).
 */
export const createSharedSqlRunner = (name: string, createLocal: () => SqlRunner): SharedSqlRunner => {
	if (!canShare()) {
		const local = createLocal();
		return { ...local, isLeader: () => true };
	}

	const self = crypto.randomUUID();
	const pending = new Map<number, { request: Request; resolve: (rows: SqlRow[]) => void; reject: (error: Error) => void }>();
	let nextId = 0;
	let channel: BroadcastChannel | undefined;
	let local: SqlRunner | undefined;
	let localScope: string | undefined;
	// The scope that this tab opened. Each call carries it, so a new leader opens the right index first.
	let tabScope: string | undefined;
	// The leader runs one call at a time, so no call from another tab runs between a scope check and its SQL.
	let serving: Promise<unknown> = Promise.resolve();

	const runLocal = async (request: Request): Promise<SqlRow[]> => {
		local ??= createLocal();
		if (request.op === 'open') {
			const state = await local.open(request.scopeId);
			localScope = request.scopeId;
			return [state as unknown as SqlRow];
		}
		if (request.op === 'wipe') {
			await local.wipe(request.scopeId);
			if (localScope === request.scopeId) localScope = undefined;
			return [];
		}
		if (request.op === 'close') {
			await local.close(request.scopeId);
			if (localScope === request.scopeId) localScope = undefined;
			return [];
		}
		if (request.scopeId !== undefined && request.scopeId !== localScope) {
			await local.open(request.scopeId);
			localScope = request.scopeId;
		}
		switch (request.op) {
			case 'exec':
				return local.exec(request.statement);
			case 'batch':
				await local.batch(request.statements);
				return [];
			case 'flush':
				await local.flush();
				return [];
		}
	};

	const serve = (request: Request): Promise<SqlRow[]> => {
		const result = serving.then(() => runLocal(request));
		serving = result.catch(() => undefined);
		return result;
	};

	let leader = false;
	// The wait for the lock, and the release of the lock once this tab holds it.
	let lockWait: AbortController | undefined;
	let releaseLock: (() => void) | undefined;

	const settle = (id: number, rows: SqlRow[] | undefined, error: string | undefined) => {
		const call = pending.get(id);
		if (!call) return;
		pending.delete(id);
		if (error !== undefined) call.reject(new Error(error));
		else call.resolve(rows ?? []);
	};

	const runOwn = (id: number, request: Request) =>
		serve(request).then(
			(rows) => settle(id, rows, undefined),
			(error: unknown) => settle(id, undefined, error instanceof Error ? error.message : String(error)),
		);

	const onMessage = ({ data }: MessageEvent<Message>) => {
		if (data.kind === 'reply' && data.to === self) {
			settle(data.id, data.rows, data.error);
			return;
		}
		if (data.kind === 'leader') {
			// A new leader: it did not get the calls that the last leader did not answer.
			for (const [id, call] of pending) channel?.postMessage({ kind: 'request', from: self, id, request: call.request } satisfies Message);
			return;
		}
		if (data.kind === 'request' && leader) {
			const { from, id, request } = data;
			serve(request).then(
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
		channel = new BroadcastChannel(name);
		channel.onmessage = onMessage;
		lockWait = new AbortController();
		void navigator.locks
			.request(name, { signal: lockWait.signal }, () => {
				leader = true;
				for (const [id, call] of pending) void runOwn(id, call.request);
				channel?.postMessage({ kind: 'leader', from: self } satisfies Message);
				// The tab keeps the lock until the index closes or the tab closes.
				return new Promise<void>((release) => {
					releaseLock = release;
				});
			})
			.catch(() => undefined);
	};

	// Gives up the lock, or the wait for it, and closes the channel. The next call starts again, and another tab takes the lock.
	const stop = () => {
		lockWait?.abort();
		lockWait = undefined;
		releaseLock?.();
		releaseLock = undefined;
		channel?.close();
		channel = undefined;
		leader = false;
		for (const call of pending.values()) call.reject(new Error('E2EE search index is closed'));
		pending.clear();
	};

	const send = (request: Request): Promise<SqlRow[]> =>
		new Promise<SqlRow[]>((resolve, reject) => {
			start();
			const id = nextId++;
			pending.set(id, { request, resolve, reject });
			if (leader) void runOwn(id, request);
			else channel?.postMessage({ kind: 'request', from: self, id, request } satisfies Message);
		});

	return {
		isLeader: () => leader,
		open: async (scopeId) => {
			const [state] = await send({ op: 'open', scopeId });
			tabScope = scopeId;
			return state as unknown as SqlScopeState;
		},
		exec: (statement) => send({ op: 'exec', scopeId: tabScope, statement }),
		batch: async (statements) => {
			await send({ op: 'batch', scopeId: tabScope, statements });
		},
		flush: async () => {
			await send({ op: 'flush', scopeId: tabScope });
		},
		wipe: async (scopeId) => {
			if (tabScope === scopeId) tabScope = undefined;
			await send({ op: 'wipe', scopeId });
		},
		close: async (scopeId) => {
			if (tabScope === scopeId) tabScope = undefined;
			try {
				// A tab that never started has no index to save.
				if (channel) await send({ op: 'close', scopeId });
			} finally {
				stop();
			}
		},
	};
};
