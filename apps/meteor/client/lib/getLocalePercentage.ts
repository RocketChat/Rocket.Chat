export const getLocalePercentage = (locale: string, total: number, fraction: number, decimalCount = 2): string => {
	const option = {
		style: 'percent',
		minimumFractionDigits: decimalCount,
		maximumFractionDigits: decimalCount,
	};

	return new Intl.NumberFormat(locale, option).format(fraction / total);
};
