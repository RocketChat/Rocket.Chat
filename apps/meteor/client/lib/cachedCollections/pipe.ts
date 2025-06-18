interface IPipeReturn<D> {
	slice(skip: number, limit: number): IPipeReturn<D>;
	sortByField(fieldName: keyof D, direction?: 1 | -1): IPipeReturn<D>;
	apply(arg: D[]): D[];
	readonly acc: PipeFunction<D>;
	pipe(p: IPipeReturn<D>): IPipeReturn<D>;
}

type PipeFunction<D> = (arg: D[]) => D[];

const merge =
	<D>(fn: PipeFunction<D>, inner: PipeFunction<D>): PipeFunction<D> =>
	(args) =>
		fn(inner(args));

export const pipe = <D>(acc: PipeFunction<D> = (arg) => [...arg]) => {
	return {
		slice(skip = 0, limit: number) {
			return pipe<D>(merge<D>((arr) => arr.slice(skip, skip + limit), acc));
		},

		sortByField(fieldName: keyof D, direction: 1 | -1 = 1) {
			return pipe<D>(
				merge(
					(arr: D[]) =>
						arr.sort((a, b) => {
							const aValue = a[fieldName];
							const bValue = b[fieldName];

							if (typeof aValue === 'string' && typeof bValue === 'string') {
								return direction * aValue.localeCompare(bValue);
							}
							if (typeof aValue === 'number' && typeof bValue === 'number') {
								return direction * (aValue - bValue);
							}
							return 0;
						}),
					acc,
				),
			);
		},

		apply: acc,
		acc,
		pipe(p: IPipeReturn<D>) {
			return pipe<D>(merge(p.acc, acc));
		},
	};
};
