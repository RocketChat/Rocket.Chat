export const getTop = (
	limit = 5,
	data: { label: string; value: number }[] | undefined = [],
	formatter: (others: number) => { label: string; value: number },
) => {
	if (data.length < limit) {
		return data;
	}

	const topItems = data.slice(0, limit);
	const othersValue = data.slice(limit).reduce((total, item) => total + item.value, 0);
	return [...topItems, formatter(othersValue)];
};
