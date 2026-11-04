/** Runs `fn` over `items` with at most `size` calls in flight. */
export const pool = async (items, size, fn) => {
	const results = new Array(items.length);
	let next = 0;
	await Promise.all(
		Array.from({ length: Math.min(size, items.length) }, async () => {
			while (next < items.length) {
				const i = next++;
				results[i] = await fn(items[i], i);
			}
		}),
	);
	return results;
};
