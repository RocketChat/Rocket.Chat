export const getTop = <T extends { label: string; value: number }>(limit = 5, data: T[], formatter: (others: number) => T): T[] => {
	if (data.length < limit) {
		return data;
	}

	const topItems = data.slice(0, limit);
	const othersValue = data.slice(limit).reduce((total, item) => total + item.value, 0);

	return othersValue > 0 ? [...topItems, formatter(othersValue)] : topItems;
};
