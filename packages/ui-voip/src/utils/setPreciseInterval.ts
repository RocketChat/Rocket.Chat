export const setPreciseInterval = (fn: () => void, duration: number) => {
	let timeoutId: Parameters<typeof clearTimeout>[0] = undefined;
	const startTime = new Date().getTime();

	const run = () => {
		fn();
		const currentTime = new Date().getTime();

		let nextTick = duration - (currentTime - startTime);

		if (nextTick < 0) {
			nextTick = 0;
		}

		timeoutId = setTimeout(() => {
			run();
		}, nextTick);
	};

	run();

	return () => {
		timeoutId && clearTimeout(timeoutId);
	};
};
