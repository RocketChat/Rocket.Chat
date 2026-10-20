const MAX_ATTEMPTS = 3;

// A lazily loaded chunk that fails once (a dropped connection, a network change) would otherwise reject every later import of it, leaving the app stuck
if (typeof __webpack_require__ !== 'undefined') {
	const loadChunk: (chunkId: string | number) => Promise<unknown> = __webpack_require__.e;

	__webpack_require__.e = async (chunkId: string | number) => {
		for (let attempt = 1; ; attempt++) {
			try {
				return await loadChunk(chunkId);
			} catch (error) {
				if (attempt >= MAX_ATTEMPTS) {
					throw error;
				}
				await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
			}
		}
	};
}
