export const throttle = <TFunction extends (...args: any[]) => any>(
	func: TFunction,
	limit: number,
): {
	(this: ThisParameterType<TFunction>, ...args: Parameters<TFunction>): void;
} => {
	let inThrottle = false;

	return function (...args) {
		if (!inThrottle) {
			func.apply(this, args);
			inThrottle = true;
			setTimeout(() => {
				inThrottle = false;
			}, limit);
		}
	};
};
