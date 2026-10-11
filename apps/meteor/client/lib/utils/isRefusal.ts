/**
 * Whether the server answered, and its answer was no.
 *
 * Two shapes, because the app's client rewrites one of them: `RestClient` rejects with the `Response` for
 * anything that is not ok, and `RestApiClient`'s middleware then replaces it with the error body that response
 * carried — so in the browser what arrives is the body, and in a spec against the bare client it is the
 * `Response`.
 *
 * Worth telling apart wherever a failure decides what the reader is shown: an answer is about the thing they
 * asked for — it is gone, or was never theirs — and a request that never arrived says nothing about it at all.
 * Presenting the second as the first sends someone away from something that is still there.
 */
export const isRefusal = (error: unknown): boolean => {
	// Guarded, because `Response` is not everywhere: jsdom does not define it, and an `instanceof` against a name
	// that does not exist throws — which would turn every caller's error path into a different error.
	if (typeof Response !== 'undefined' && error instanceof Response) {
		return error.status >= 400 && error.status < 500;
	}

	return typeof error === 'object' && error !== null && 'success' in error && (error as { success?: unknown }).success === false;
};
