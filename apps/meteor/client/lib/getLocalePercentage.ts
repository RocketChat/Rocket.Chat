export const getLocalePercentage = (locale: string, total: number, fraction: number, decimalCount = 2) =>
	new Intl.NumberFormat(locale, {
		style: 'percent',
		minimumFractionDigits: decimalCount,
		maximumFractionDigits: decimalCount,
	}).format(fraction / total);
