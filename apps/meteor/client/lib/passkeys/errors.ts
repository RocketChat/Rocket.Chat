/** The user dismissed the browser's passkey prompt, let it time out, or another ceremony replaced it. */
export const isPasskeyCeremonyCancelled = (error: unknown): boolean =>
	error instanceof Error && (error.name === 'NotAllowedError' || error.name === 'AbortError');

export const isRestError = (error: unknown): error is { errorType: string; error?: string } =>
	typeof error === 'object' && error !== null && 'errorType' in error && typeof error.errorType === 'string';
