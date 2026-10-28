// The messages between the page (`client/lib/e2eeSearch/browser/workerSqlRunner.ts`) and the worker.

export type SqlValue = string | number | null;

export type SqlStatement = { sql: string; bind?: SqlValue[] };

export type SqlRow = Record<string, SqlValue>;

export type ScopeState = { persistent: boolean; restored: boolean; evicted?: boolean };

export type WorkerRequest = { id: number } & (
	| { op: 'open'; scopeId: string }
	| { op: 'wipe'; scopeId?: string }
	| { op: 'close'; scopeId: string }
	| { op: 'flush' }
	| ({ op: 'exec' } & SqlStatement)
	| { op: 'batch'; statements: SqlStatement[] }
);

export type WorkerReply = { id: number; rows?: SqlRow[]; error?: string };
