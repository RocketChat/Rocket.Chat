// based on _.debounce
export const debounce = <FuncType extends (...args: any[]) => any>(
	func: FuncType,
	wait = 0,
	immediate = false,
): ((...args: any[]) => ReturnType<typeof func>) & {
	flush: () => void;
	cancel: () => void;
} => {
	let result: ReturnType<FuncType>;
	let timeout: ReturnType<typeof setTimeout> | null;
	let previous: number;
	let later: () => void;
	let callFn: () => void;

	function debounced(this: ThisParameterType<FuncType>, ...args: any[]) {
		previous = Date.now();

		if (!timeout) {
			callFn = () => {
				result = func.apply(this, args);
			};

			later = () => {
				const passed = Date.now() - previous;

				if (wait > passed) {
					timeout = setTimeout(later, wait - passed);
				} else {
					timeout = null;
					if (!immediate) {
						callFn();
					}
				}
			};

			timeout = setTimeout(later, wait);
			if (immediate) {
				result = func.apply(this, args);
			}
		}

		return result;
	}

	debounced.flush = () => {
		if (timeout && !immediate) {
			clearTimeout(timeout);
			timeout = null;
			callFn();
		}
	};

	debounced.cancel = () => {
		if (timeout) {
			clearTimeout(timeout);
			timeout = null;
		}
	};

	return debounced;
};
