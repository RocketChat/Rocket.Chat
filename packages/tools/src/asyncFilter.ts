export const asyncFilter = async <T>(array: T[], cb: (el: T) => Promise<boolean>): Promise<T[]> => {
	return (
		await Promise.all(
			array.map(async (element) => ({
				element,
				include: await cb(element),
			})),
		)
	)
		.filter((item) => item.include)
		.map(({ element }) => element);
};
