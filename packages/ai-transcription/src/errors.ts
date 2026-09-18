export type TranscriptionErrorCode = 'engine-unreachable' | 'engine-error' | 'timeout' | 'invalid-response' | 'not-configured';

export class TranscriptionError extends Error {
	public readonly code: TranscriptionErrorCode;

	public readonly status?: number;

	constructor(code: TranscriptionErrorCode, message?: string, options?: { cause?: unknown; status?: number }) {
		super(message ?? code, { cause: options?.cause });
		this.name = 'TranscriptionError';
		this.code = code;
		this.status = options?.status;
	}
}

export const isTranscriptionError = (error: unknown): error is TranscriptionError => error instanceof TranscriptionError;
