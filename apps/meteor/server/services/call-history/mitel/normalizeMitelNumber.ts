export function normalizeMitelNumber(number: string | undefined): string | null {
	if (!number) {
		return null;
	}

	const numberSansSign = number.match(/^\+?(.*)$/)?.[1];
	if (!numberSansSign) {
		return null;
	}

	const digits = numberSansSign.match(/^0*(\d*)$/)?.[1];
	return digits || numberSansSign;
}
