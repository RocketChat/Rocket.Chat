export const guessTimezoneFromOffset = (offset: string | number): string => {
	const hours = Number(offset);
	const totalMinutes = Math.round(hours * 60);

	const supportedZones = Intl.supportedValuesOf('timeZone');
	const now = new Date();

	for (const tz of supportedZones) {
		// Skip synthetic Etc/ zones — prefer geographic names (DST-aware)
		if (tz.startsWith('Etc/')) {
			continue;
		}
		const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
		const parts = formatter.formatToParts(now);
		const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
		// tzPart looks like "GMT", "GMT+5:30", "GMT-3"
		const match = tzPart.match(/^GMT([+-]\d{1,2}(?::(\d{2}))?)?$/);
		if (!match) {
			continue;
		}
		const tzHours = match[1] ? parseInt(match[1], 10) : 0;
		const tzMinutes = match[2] ? parseInt(match[2], 10) * (tzHours < 0 ? -1 : 1) : 0;
		if (tzHours * 60 + tzMinutes === totalMinutes) {
			return tz;
		}
	}

	// Fallback to Etc/GMT when no geographic zone matches
	const intHours = Math.trunc(hours);
	if (intHours === 0) {
		return 'Etc/GMT';
	}
	return `Etc/GMT${intHours > 0 ? '-' : '+'}${Math.abs(intHours)}`;
};

export const guessTimezone = (): string => new Intl.DateTimeFormat().resolvedOptions().timeZone;
