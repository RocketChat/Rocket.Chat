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

/** Sends the SQL of the E2EE search index to the SQLite worker at `workerUrl`, which starts on the first call. */
export const createWorkerSqlRunner = (workerUrl: string | URL): SqlRunner => {
	const pending = new Map<number, { resolve: (rows: SqlRow[]) => void; reject: (error: Error) => void }>();
	let nextId = 0;
	let worker: Worker | undefined;

	const start = (): Worker => {
		const started = new Worker(workerUrl, { type: 'module', name: 'e2ee-search-index' });

		started.onmessage = ({ data }: MessageEvent<WorkerReply>) => {
			const call = pending.get(data.id);
			if (!call) return;
			pending.delete(data.id);
			if (data.error !== undefined) call.reject(new Error(data.error));
			else call.resolve(data.rows ?? []);
		};

		started.onerror = (event) => {
			// The next call starts a new worker. An error of a worker that is already replaced changes nothing.
			if (worker !== started) return;
			worker = undefined;
			started.terminate();
			event.preventDefault();
			const error = new Error(`E2EE search worker failed: ${event.message || 'the worker did not start'}`);
			for (const call of pending.values()) call.reject(error);
			pending.clear();
		};

		return started;
	};

	const send = (request: Record<string, unknown>) =>
		new Promise<SqlRow[]>((resolve, reject) => {
			const id = nextId++;
			pending.set(id, { resolve, reject });
			worker ??= start();
			worker.postMessage({ ...request, id });
		});

	return {
		open: async (scopeId, wrapKey, schema) => {
			const state = (await send({ op: 'open', scopeId, wrapKey }))[0] as unknown as SqlScopeState;
			if (!state.locked && schema !== undefined) await send({ op: 'exec', sql: schema });
			return state;
		},
		exec: (statement) => send({ op: 'exec', ...statement }),
		batch: async (statements) => {
			await send({ op: 'batch', statements });
		},
		flush: async () => {
			await send({ op: 'flush' });
		},
		wipe: async (scopeId) => {
			await send({ op: 'wipe', scopeId });
		},
		close: async (scopeId) => {
			await send({ op: 'close', scopeId });
		},
	};
};
