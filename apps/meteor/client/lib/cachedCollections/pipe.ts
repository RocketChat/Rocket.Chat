interface IPipeReturn<D> {
	slice(skip: number, limit: number): IPipeReturn<D>;
	sortByField(fieldName: keyof D, direction?: 1 | -1): IPipeReturn<D>;
	apply(arg: D[]): D[];
	readonly acc: Array<(arg: D[]) => D[]>;
	pipe(p: IPipeReturn<D>): IPipeReturn<D>;
}

interface IPipeFunction {
	<D>(acc?: Array<(arg: D[]) => D[]>): IPipeReturn<D>;
}

export const pipe: IPipeFunction = <D>(acc: Array<(arg: D[]) => D[]> = []) => {
	return {
		slice(skip = 0, limit: number) {
			return pipe<D>([...acc, (arr: D[]) => arr.slice(skip, skip + limit)]);
		},

		sortByField(fieldName: keyof D, direction: 1 | -1 = 1) {
			return pipe<D>([
				...acc,
				(arr: D[]) =>
					arr.sort((a, b) => {
						const aValue = a[fieldName];
						const bValue = b[fieldName];

						if (aValue === undefined || bValue === undefined) {
							return 0;
						}
						if (typeof aValue === 'string' && typeof bValue === 'string') {
							return direction * aValue.localeCompare(bValue);
						}
						if (typeof aValue === 'number' && typeof bValue === 'number') {
							return direction * (aValue - bValue);
						}
						return 0;
					}),
			]);
		},

		apply(arg: D[]): D[] {
			return acc.reduce((acc, fn) => fn([...acc]), arg);
		},
		acc,
		pipe(p: IPipeReturn<D>) {
			return pipe<D>([...acc, ...p.acc]);
		},
	};
};
