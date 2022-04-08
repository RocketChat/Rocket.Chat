export const sortAppsByClosestOrFarthestModificationDate = (firstDateString: string, secondDateString: string): number => {
	const firstDate = new Date(firstDateString);
	const secondDate = new Date(secondDateString);

	return +secondDate - +firstDate;
};
