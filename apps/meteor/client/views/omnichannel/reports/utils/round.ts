export const round = (value: number, decimals = 2) => {
	const multiplier = Math.pow(10, decimals);
	return Math.round(value * multiplier) / multiplier;
};
