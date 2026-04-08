export const guessTimezoneFromOffset = (offset: string | number): string => {
	const hours = Math.trunc(Number(offset));
	// Etc/GMT sign convention is inverted: Etc/GMT+5 = UTC-5
	if (hours === 0) {
		return 'Etc/GMT';
	}
	return `Etc/GMT${hours > 0 ? '-' : '+'}${Math.abs(hours)}`;
};

export const guessTimezone = (): string => new Intl.DateTimeFormat().resolvedOptions().timeZone;
