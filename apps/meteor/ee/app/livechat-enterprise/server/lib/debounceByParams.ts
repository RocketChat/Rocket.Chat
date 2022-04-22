import debounce from 'lodash.debounce';
import mem from 'mem';

export interface IMemoizeDebouncedFunction<F extends (...args: any[]) => any> {
	(...args: Parameters<F>): void;
	flush: (...args: Parameters<F>) => void;
}

// Debounce `func` based on passed parameters
// ref: https://github.com/lodash/lodash/issues/2403#issuecomment-816137402
export function memoizeDebounce<F extends (...args: any[]) => any>(func: F, wait = 0, options: any = {}): IMemoizeDebouncedFunction<F> {
	const debounceMemo = mem(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		(..._args: Parameters<F>) => debounce(func, wait, options),
	);

	function wrappedFunction(this: IMemoizeDebouncedFunction<F>, ...args: Parameters<F>): ReturnType<F> | undefined {
		return debounceMemo(...args)(...args);
	}

	wrappedFunction.flush = (...args: Parameters<F>): void => {
		debounceMemo(...args).flush();
	};

	return wrappedFunction as unknown as IMemoizeDebouncedFunction<F>;
}
