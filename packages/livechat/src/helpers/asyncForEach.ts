export const asyncForEach = async <T>(array: T[], callback: (item: T, index: number, array: T[]) => Promise<void>) => {
	for (let index = 0; index < array.length; index++) {
		// eslint-disable-next-line no-await-in-loop
		await callback(array[index], index, array);
	}
};
