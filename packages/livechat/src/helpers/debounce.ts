export const debounce = <TFunction extends (...args: any[]) => any>(
	func: TFunction,
	delay: number,
): {
	(this: ThisParameterType<TFunction>, ...args: Parameters<TFunction>): ThisParameterType<TFunction>;
	stop: () => void;
} => {
	let inDebounce: ReturnType<typeof setTimeout>;

	function f(this: ThisParameterType<TFunction>, ...args: Parameters<TFunction>) {
		clearTimeout(inDebounce);
		inDebounce = setTimeout(() => func.apply(this, args), delay);
		return this;
	}

	f.stop = () => clearTimeout(inDebounce);

	return f;
};
