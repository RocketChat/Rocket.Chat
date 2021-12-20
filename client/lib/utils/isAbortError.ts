export const isAbortError = (error: unknown): error is DOMException & { name: 'AbortError' } =>
	error instanceof DOMException && error.name === 'AbortError';
