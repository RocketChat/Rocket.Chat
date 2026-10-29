// The messages between the page (`client/lib/e2eeSearch/browser/workerSqlRunner.ts`) and the worker.

export type SqlValue = string | number | null;

export type SqlStatement = { sql: string; bind?: SqlValue[] };

export type SqlRow = Record<string, SqlValue>;

// `locked`: the open had no wrap key. No index is open, and the copy stays. An open with a wrap key that does not open
// the saved copy deletes the copy and starts an empty index.
export type ScopeState = { persistent: boolean; restored: boolean; evicted?: boolean; locked?: boolean };

export type WorkerRequest = { id: number } &
	// `wrapKey` is the non-extractable HKDF key that the page imported from the 32-byte wrap key of the user.
	(
		| { op: 'open'; scopeId: string; wrapKey?: CryptoKey }
		| { op: 'wipe'; scopeId?: string }
		| { op: 'close'; scopeId: string }
		| { op: 'flush' }
		| ({ op: 'exec' } & SqlStatement)
		| { op: 'batch'; statements: SqlStatement[] }
	);

export type WorkerReply = { id: number; rows?: SqlRow[]; error?: string };
