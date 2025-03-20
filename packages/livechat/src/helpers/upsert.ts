const getInsertIndex = <T>(array: T[], item: T, ranking: (item: T) => number) => {
	const order = ranking(item);
	let min = 0;
	let max = array.length - 1;

	while (min <= max) {
		const guess = Math.floor((min + max) / 2);
		const guessedOrder = ranking(array[guess]);
		if (guessedOrder < order) {
			min = guess + 1;
		} else if (guess + 1 <= max && guessedOrder > ranking(array[guess + 1])) {
			return guess;
		} else {
			max = guess - 1;
		}
	}

	return array.length > 0 ? array.length : 0;
};

export const upsert = <T>(array: T[] = [], item: T, predicate: (item: T) => boolean, ranking: (item: T) => number) => {
	const index = array.findIndex(predicate);

	if (index > -1) {
		array[index] = item;
		return array;
	}

	array.splice(getInsertIndex(array, item, ranking), 0, item);
	return array;
};
