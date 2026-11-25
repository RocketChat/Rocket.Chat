const DUPLICATE_KEY_ERROR_CODE = 11000;

/** Whether a write failed because a unique index already holds the value. */
export const isDuplicateKeyError = (error: unknown): boolean =>
	typeof error === 'object' && error !== null && (error as { code?: unknown }).code === DUPLICATE_KEY_ERROR_CODE;
