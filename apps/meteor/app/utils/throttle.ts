// based on _.throttle
export const throttle = <FuncType extends (...args: any[]) => any>(
	func: FuncType,
	wait: number,
	options?: { leading?: boolean; trailing?: boolean },
) => {
	const leading = options?.leading === undefined ? true : options.leading;
	const trailing = options?.trailing === undefined ? true : options.trailing;
	let timeout: ReturnType<typeof setTimeout> | null;
	let result: ReturnType<FuncType>;
	let previous = 0;

	const throttled = function (this: ThisParameterType<FuncType>, ...args: any[]) {
		const now = Date.now();

		if (!previous && leading === false) {
			previous = now;
		}

		const remaining = wait - (now - previous);

		if (remaining <= 0 || remaining > wait) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}

			previous = now;
			result = func.apply(this, args);
		} else if (!timeout && trailing !== false) {
			const later = () => {
				previous = leading === false ? 0 : Date.now();
				timeout = null;
				result = func.apply(this, args);
			};

			timeout = setTimeout(later, remaining);
		}

		return result;
	};

	throttled.cancel = () => {
		if (timeout) {
			clearTimeout(timeout);
			previous = 0;
			timeout = null;
		}
	};

	return throttled;
};
