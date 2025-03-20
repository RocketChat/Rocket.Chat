export const compareByRanking =
	<T>(rank: (x: T) => number) =>
	(a: T, b: T) => {
		return rank(a) - rank(b);
	};
