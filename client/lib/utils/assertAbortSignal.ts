export const assertAbortSignal: (
	signal?: AbortSignal,
) => asserts signal is AbortSignal | undefined = (signal) => {
	if (signal?.aborted) {
		throw new DOMException('Aborted', 'AbortError');
	}
};
