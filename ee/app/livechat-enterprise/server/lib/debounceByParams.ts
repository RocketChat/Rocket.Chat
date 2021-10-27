import debounce from 'lodash.debounce';
import memoize from 'lodash.memoize';


export interface IMemoizeDebouncedFunction<F extends (...args: any[]) => any> {
	(...args: Parameters<F>): void;
	flush: (...args: Parameters<F>) => void;
}

// copied to avoid having to import lodash for a single typedef
// ref: https://github.com/DefinitelyTyped/DefinitelyTyped/blob/61bb91fa4eb8090c5be0286fd1d2a677a88a83b8/types/lodash/common/function.d.ts#L371
interface IDebouncedFunc<T extends (...args: any[]) => any> {
	(...args: Parameters<T>): ReturnType<T> | undefined;
	cancel(): void;
	flush(): ReturnType<T> | undefined;
}

// Debounce `func` based on passed parameters
// ref: https://github.com/lodash/lodash/issues/2403#issuecomment-816137402
export function memoizeDebounce<F extends(...args: any[]) => any>(
	func: F,
	wait = 0,
	options: any = {},
	resolver?: (...args: Parameters<F>) => unknown,
): IMemoizeDebouncedFunction<F> {
	const debounceMemo = memoize<(...args: Parameters<F>) => IDebouncedFunc<F>>(
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		(..._args: Parameters<F>) => debounce(func, wait, options),
	resolver,
	);

	function wrappedFunction(
		this: IMemoizeDebouncedFunction<F>,
		...args: Parameters<F>
	): ReturnType<F> | undefined {
		return debounceMemo(...args)(...args);
	}

	wrappedFunction.flush = (...args: Parameters<F>): void => {
		debounceMemo(...args).flush();
	};

	return (wrappedFunction as unknown) as IMemoizeDebouncedFunction<F>;
}
