export function cache<
	TFunction extends (...args: unknown[]) => Promise<unknown>,
>(fn: TFunction, timeout: number): TFunction {
	let cached: Awaited<ReturnType<TFunction>> | undefined;
	let timestamp = Date.now();

	return (async (...args) => {
		if (Date.now() - timestamp > timeout) {
			timestamp = Date.now();
			cached = undefined;
		}

		if (cached === undefined) {
			cached = (await fn(...args)) as any;
		}

		return cached;
	}) as TFunction;
}
