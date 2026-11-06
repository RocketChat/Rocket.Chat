type Next<T extends (...args: any[]) => any> = (...args: Parameters<T>) => ReturnType<T>;

type Middleware<T extends (...args: any[]) => any> = (context: Parameters<T>, next: Next<T>) => ReturnType<T>;

const pipe =
	<T extends (...args: any[]) => any>(fn: T) =>
	(...args: Parameters<T>): ReturnType<T> =>
		fn(...args);

export const use = <T extends (...args: any[]) => any>(fn: T, middleware: Middleware<T>): T =>
	function (this: unknown, ...context: Parameters<T>): ReturnType<T> {
		return middleware(context, pipe(fn.bind(this)));
	} as T;
