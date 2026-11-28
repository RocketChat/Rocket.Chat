/** Whether the error is the body of a REST 403 refusal, which never changes on retry. */
export const isForbiddenError = (error: unknown): boolean =>
	typeof error === 'object' && error !== null && (error as { errorType?: unknown }).errorType === 'error-forbidden';
