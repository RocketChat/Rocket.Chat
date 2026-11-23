export const isContactNotFoundError = (error: unknown): boolean =>
	typeof error === 'object' && error !== null && 'error' in error && error.error === 'error-contact-not-found';
