import { DEV_DB_EXIT_CODES } from './exit-codes';

export class DevDbError extends Error {
	public readonly code: number;
	public readonly details?: Record<string, unknown>;

	constructor(message: string, code: number, details?: Record<string, unknown>) {
		super(message);
		this.name = 'DevDbError';
		this.code = code;
		this.details = details;
	}
}

export class LockConflictError extends DevDbError {
	constructor(message = 'Another dev-db command is already in progress.', details?: Record<string, unknown>) {
		super(message, DEV_DB_EXIT_CODES.LOCK_CONFLICT, details);
		this.name = 'LockConflictError';
	}
}

export class BackendNotImplementedError extends DevDbError {
	constructor(backend: string) {
		super(
			`Backend \`${backend}\` is not implemented yet. For now, use \`--backend external\` with DEV_DB_EXTERNAL_MONGO_URL (or MONGO_URL).`,
			DEV_DB_EXIT_CODES.BACKEND_NOT_IMPLEMENTED,
			{ backend },
		);
		this.name = 'BackendNotImplementedError';
	}
}

export class BackendUnavailableError extends DevDbError {
	constructor(message: string, details?: Record<string, unknown>) {
		super(message, DEV_DB_EXIT_CODES.BACKEND_NOT_AVAILABLE, details);
		this.name = 'BackendUnavailableError';
	}
}
