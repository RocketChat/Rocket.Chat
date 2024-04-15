import { throttle } from '../../app/utils/throttle';

export function throttledCounter(fn: (counter: number) => unknown, wait: number) {
	let counter = 0;

	const throttledFn = throttle(
		() => {
			fn(counter);

			counter = 0;
		},
		wait,
		{ leading: false },
	);

	return () => {
		counter++;
		throttledFn();
	};
}
