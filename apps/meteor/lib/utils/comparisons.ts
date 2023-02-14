export const compareByRanking =
	<T>(rank: (x: T) => number) =>
	(a: T, b: T) => {
		return rank(a) - rank(b);
	};

export const maxByRanking =
	<T>(rank: (x: T) => number) =>
	(...xs: T[]) =>
		xs.reduce((a, b) => (rank(a) > rank(b) ? a : b));

export const minByRanking =
	<T>(rank: (x: T) => number) =>
	(...xs: T[]) =>
		xs.reduce((a, b) => (rank(a) < rank(b) ? a : b));

const rankDate = (x: Date) => x.getTime();

export const compareDates = compareByRanking(rankDate);

export const maxDate = maxByRanking(rankDate);

export const minDate = minByRanking(rankDate);

export const unique = <T>(xs: T[]) => Array.from(new Set(xs));

export const difference = <T>(xs: T[], ys: T[]) => {
	const set = new Set(ys);
	return xs.filter((x) => !set.has(x));
};
