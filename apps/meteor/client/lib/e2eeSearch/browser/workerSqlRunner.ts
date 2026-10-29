export type SqlStatement = { sql: string; bind?: (string | number | null)[] };

export type SqlRow = Record<string, string | number | null>;

export type SqlScopeState = {
	/** True when an encrypted copy of the database is kept on disk, false when the database is memory only. */
	persistent: boolean;
	/** True when the database came from that copy. */
	restored: boolean;
	/**
	 * True when a copy was saved before but is gone or cannot be read now, so the database starts empty. The browser
	 * deletes the copy when it evicts the storage of the site.
	 */
	evicted?: boolean;
	/**
	 * True when the open had no wrap key: no database is open, and the copy on disk stays as it is.
	 */
	locked?: boolean;
};

/** Runs SQL in the database of the E2EE search index. */
export type SqlRunner = {
	/**
	 * Switches to the database of `scopeId`. A database kept on disk for that scope comes back. `wrapKey` is the
	 * non-extractable HKDF key of the user's wrap key: without it the open is locked. With another one than the one that
	 * sealed the copy (a new E2EE key), the copy is deleted and the database starts empty. `schema` runs after each open
	 * that is not locked, also when a runner opens the database again by itself, so it must be safe to repeat.
	 */
	open(scopeId: string, wrapKey?: CryptoKey, schema?: string): Promise<SqlScopeState>;
	exec(statement: SqlStatement): Promise<SqlRow[]>;
	/** Runs every statement in one transaction: all of them apply, or none. */
	batch(statements: SqlStatement[]): Promise<void>;
	/** Writes the changes to disk now, not after the save delay. */
	flush(): Promise<void>;
	/** Deletes the database of `scopeId`, its copy on disk and its key. The open database closes when it is that one. */
	wipe(scopeId: string): Promise<void>;
	/** Saves the database of `scopeId` and closes it. The copy on disk stays, so the next `open` of that scope restores it. */
	close(scopeId: string): Promise<void>;
};

type WorkerReply = { id: number; rows?: SqlRow[]; error?: string };

type WorkerRequest = { op: string } & Record<string, unknown>;

// A call that gets no answer in this time fails, so a stalled worker does not hang the caller.
const CALL_TIMEOUT_MS = 30_000;

const ignore = (): void => undefined;

/** Sends the SQL of the E2EE search index to the SQLite worker at `workerUrl`, which starts on the first call. */
export const createWorkerSqlRunner = (workerUrl: string | URL): SqlRunner => {
	const pending = new Map<
		number,
		{ resolve: (rows: SqlRow[]) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }
	>();
	let nextId = 0;
	let worker: Worker | undefined;
	// The last open that was not locked. A worker that replaces a failed one opens it again before its first SQL.
	let opened: { scopeId: string; wrapKey: CryptoKey; schema?: string } | undefined;
	// The open that runs now. The other calls wait for it, so no call runs between the open and its schema.
	let opening: Promise<void> | undefined;

	const settle = (id: number, rows: SqlRow[] | undefined, error: string | undefined) => {
		const call = pending.get(id);
		if (!call) return;
		pending.delete(id);
		clearTimeout(call.timer);
		if (error !== undefined) call.reject(new Error(error));
		else call.resolve(rows ?? []);
	};

	const start = (): Worker => {
		const started = new Worker(workerUrl, { type: 'module', name: 'e2ee-search-index' });

		started.onmessage = ({ data }: MessageEvent<WorkerReply>) => settle(data.id, data.rows, data.error);

		started.onerror = (event) => {
			// The next call starts a new worker. An error of a worker that is already replaced changes nothing.
			if (worker !== started) return;
			worker = undefined;
			started.terminate();
			event.preventDefault();
			const error = `E2EE search worker failed: ${event.message || 'the worker did not start'}`;
			for (const id of [...pending.keys()]) settle(id, undefined, error);
		};

		return started;
	};

	const post = (target: Worker, request: WorkerRequest, resolve: (rows: SqlRow[]) => void, reject: (error: Error) => void) => {
		const id = nextId++;
		const timer = setTimeout(
			() => settle(id, undefined, `E2EE search worker did not answer the ${request.op} call in ${CALL_TIMEOUT_MS / 1000} s`),
			CALL_TIMEOUT_MS,
		);
		pending.set(id, { resolve, reject, timer });
		target.postMessage({ ...request, id });
	};

	const send = (request: WorkerRequest) =>
		new Promise<SqlRow[]>((resolve, reject) => {
			if (!worker) {
				worker = start();
				// The worker runs its messages in order, so this open and its schema run before the SQL of the call.
				if (opened && (request.op === 'exec' || request.op === 'batch' || request.op === 'flush')) {
					post(worker, { op: 'open', scopeId: opened.scopeId, wrapKey: opened.wrapKey }, ignore, ignore);
					if (opened.schema !== undefined) post(worker, { op: 'exec', sql: opened.schema }, ignore, ignore);
				}
			}
			post(worker, request, resolve, reject);
		});

	// Also after the call: an open that ran before it can open the scope again.
	const forget = (scopeId: string) => {
		if (opened?.scopeId === scopeId) opened = undefined;
	};

	const call = (request: WorkerRequest) => (opening ? opening.then(() => send(request)) : send(request));

	return {
		open: (scopeId, wrapKey, schema) => {
			const run = async () => {
				opened = undefined;
				const state = (await send({ op: 'open', scopeId, wrapKey }))[0] as unknown as SqlScopeState;
				if (!state.locked && schema !== undefined) await send({ op: 'exec', sql: schema });
				if (!state.locked && wrapKey) opened = { scopeId, wrapKey, schema };
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
			forget(scopeId);
			try {
				await call({ op: 'wipe', scopeId });
			} finally {
				forget(scopeId);
			}
		},
		close: async (scopeId) => {
			forget(scopeId);
			try {
				await call({ op: 'close', scopeId });
			} finally {
				forget(scopeId);
			}
		},
	};
};
