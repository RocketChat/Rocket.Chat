type Middleware<F extends (...args: any[]) => any> = (ctx: Parameters<F>, next: NextFunction<F>) => ReturnType<F>;
type NextFunction<F extends (...args: any[]) => any> = (...args: Parameters<F> | []) => ReturnType<F>;

export function withMiddleware<F extends (...args: any[]) => any>(fn: F) {
	const middlewares: Middleware<F>[] = [];

	const buildRunner = (): ((ctx: Parameters<F>) => ReturnType<F>) => {
		return middlewares.reduce(
			(next, middleware) => {
				return (ctx) => middleware(ctx, (...args) => next(args.length ? (args as Parameters<F>) : ctx));
			},
			(ctx: Parameters<F>) => fn(...ctx),
		);
	};

	let runner = buildRunner();

	const use = (middleware: Middleware<F>) => {
		middlewares.push(middleware);

		runner = buildRunner();
		return () => {
			const index = middlewares.indexOf(middleware);
			if (index > -1) {
				middlewares.splice(index, 1);
			}
			runner = buildRunner();
		};
	};

	const run = (...args: Parameters<F>): ReturnType<F> => {
		return runner(args);
	};

	return Object.assign(run as F, { use, fn });
}
