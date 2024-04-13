export const debounce = <P extends unknown[], F extends (...args: P) => unknown>(
	func: (...args: P) => F | void | Promise<void>,
	wait = 0,
): ((...args: P) => void) & {
	flush: () => void;
	cancel: () => void;
} => {
	let timeout: NodeJS.Timeout | null;

	let timerFunc: () => void;

	const flush = () => {
		if (timeout) {
			clearTimeout(timeout);
			timerFunc();
		}
	};

	const cancel = () => {
		if (timeout) {
			clearTimeout(timeout);
		}
	};

	const debounced = (...args: P) => {
		timerFunc = () => {
			timeout = null;
			void func(...args);
		};

		if (timeout) {
			clearTimeout(timeout);
		}

		timeout = setTimeout(() => timerFunc, wait);
	};

	return Object.assign(debounced, { flush, cancel });
};
