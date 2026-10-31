import type { E2EESearchIndexEvent } from '@rocket.chat/desktop-api';

export type SqlIndexEvent = E2EESearchIndexEvent & { scopeId: string };
export type SqlStatement = { sql: string; bind?: (string | number | null)[] };
export type SqlRow = Record<string, string | number | null>;
export type SqlScopeState = {
	persistent: boolean;
	restored: boolean;
	evicted?: boolean;
	locked?: boolean;
};

export type SqlRunner = {
	/** The schema must be safe to repeat after worker replacement. */
	open(scopeId: string, wrapKey?: CryptoKey, schema?: string): Promise<SqlScopeState>;
	exec(statement: SqlStatement): Promise<SqlRow[]>;
	/** Apply every statement, or none. */
	batch(statements: SqlStatement[]): Promise<void>;
	flush(): Promise<void>;
	wipe(scopeId: string): Promise<void>;
	close(scopeId: string): Promise<void>;
	onIndexEvent?(listener: (event: SqlIndexEvent) => void): () => void;
};

type WorkerReply = { id: number; rows?: SqlRow[]; error?: string };
type WorkerRequest = { op: string } & Record<string, unknown>;
const CALL_TIMEOUT_MS = 30_000;
const ignore = (): void => undefined;

export const createWorkerSqlRunner = (workerUrl: string | URL): SqlRunner => {
	const pending = new Map<
		number,
		{ resolve: (rows: SqlRow[]) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }
	>();
	const listeners = new Set<(event: SqlIndexEvent) => void>();
	let nextId = 0;
	let worker: Worker | undefined;
	let opened: { scopeId: string; wrapKey: CryptoKey; schema?: string } | undefined;
	let opening: Promise<void> | undefined;
	let recovering: Promise<void> | undefined;
	let generation = 0;

	const emit = (event: SqlIndexEvent) => {
		for (const listener of listeners) listener(event);
	};
	const settle = (id: number, rows: SqlRow[] | undefined, error: string | undefined) => {
		const call = pending.get(id);
		if (!call) return;
		pending.delete(id);
		clearTimeout(call.timer);
		if (error !== undefined) call.reject(new Error(error));
		else call.resolve(rows ?? []);
	};
	const fail = (target: Worker, error: string) => {
		if (worker !== target) return;
		worker = undefined;
		recovering = undefined;
		target.terminate();
		for (const id of [...pending.keys()]) settle(id, undefined, error);
		if (opened) emit({ scopeId: opened.scopeId, type: 'lost' });
	};
	const start = (): Worker => {
		const started = new Worker(workerUrl, { type: 'module', name: 'e2ee-search-index' });
		started.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
			if (worker === started) settle(data.id, data.rows, data.error);
		};
		started.onerror = (event) => {
			event.preventDefault();
			fail(started, `E2EE search worker failed: ${event.message || 'the worker did not start'}`);
		};
		return started;
	};
	const post = (target: Worker, request: WorkerRequest): Promise<SqlRow[]> => {
		if (worker !== target) return Promise.reject(new Error('E2EE search index is closed'));
		return new Promise((resolve, reject) => {
			const id = nextId++;
			const timer = setTimeout(
				() => fail(target, `E2EE search worker did not answer the ${request.op} call in ${CALL_TIMEOUT_MS / 1000} s`),
				CALL_TIMEOUT_MS,
			);
			pending.set(id, { resolve, reject, timer });
			try {
				target.postMessage({ ...request, id });
			} catch (error) {
				settle(id, undefined, error instanceof Error ? error.message : String(error));
			}
		});
	};
	const send = (request: WorkerRequest): Promise<SqlRow[]> => {
		if (!worker) {
			worker = start();
			const target = worker;
			const session = opened;
			const current = generation;
			if (session && ['exec', 'batch', 'flush'].includes(request.op)) {
				recovering = (async () => {
					const [row] = await post(target, { op: 'open', scopeId: session.scopeId, wrapKey: session.wrapKey });
					const state = row as unknown as SqlScopeState;
					if (current !== generation) throw new Error('E2EE search index is closed');
					if (state.locked) throw new Error('E2EE search index is locked');
					if (session.schema !== undefined) await post(target, { op: 'exec', sql: session.schema });
					if (!state.restored || state.evicted) emit({ scopeId: session.scopeId, type: 'lost' });
				})();
				const recovery = recovering;
				void recovery.then(
					() => {
						if (recovering === recovery) recovering = undefined;
					},
					() => {
						if (recovering === recovery) recovering = undefined;
						if (worker === target) {
							target.terminate();
							worker = undefined;
						}
					},
				);
			}
		}
		const target = worker;
		return recovering ? recovering.then(() => post(target, request)) : post(target, request);
	};
	const call = (request: WorkerRequest) => (opening ? opening.then(() => send(request)) : send(request));
	const forget = (scopeId: string) => {
		if (opened?.scopeId === scopeId) opened = undefined;
	};
	return {
		onIndexEvent(listener) {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		},
		open: (scopeId, wrapKey, schema) => {
			const current = ++generation;
			const run = async () => {
				if (recovering) await recovering.catch(ignore);
				opened = undefined;
				const state = (await send({ op: 'open', scopeId, wrapKey }))[0] as unknown as SqlScopeState;
				if (!state.locked && schema !== undefined) await send({ op: 'exec', sql: schema });
				if (current === generation && !state.locked && wrapKey) opened = { scopeId, wrapKey, schema };
				return state;
			};
			const result = opening ? opening.then(run) : run();
			const done = result.then(ignore, ignore);
			opening = done;
			void done.then(() => {
				if (opening === done) opening = undefined;
			});
			return result;
		},
		exec: (statement) => call({ op: 'exec', ...statement }),
		batch: async (statements) => {
			await call({ op: 'batch', statements });
		},
		flush: async () => {
			await call({ op: 'flush' });
		},
		wipe: async (scopeId) => {
			generation++;
			forget(scopeId);
			try {
				await call({ op: 'wipe', scopeId });
			} finally {
				forget(scopeId);
			}
		},
		close: async (scopeId) => {
			generation++;
			forget(scopeId);
			try {
				await call({ op: 'close', scopeId });
			} finally {
				forget(scopeId);
				worker?.terminate();
				worker = undefined;
				recovering = undefined;
				for (const id of [...pending.keys()]) settle(id, undefined, 'E2EE search index is closed');
			}
		},
	};
};
