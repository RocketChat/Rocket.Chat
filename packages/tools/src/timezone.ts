const padOffset = (offset: string | number): string => {
	const numberOffset = Number(offset);
	const absOffset = Math.abs(numberOffset);
	const isNegative = !(numberOffset === absOffset);

	return `${isNegative ? '-' : '+'}${absOffset < 10 ? `0${absOffset}` : absOffset}:00`;
};

const getTimezoneOffsetString = (timeZone: string, date: Date = new Date()): string => {
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone,
		timeZoneName: 'longOffset',
	}).formatToParts(date);
	const part = parts.find((p) => p.type === 'timeZoneName')?.value;
	if (!part || !part.startsWith('GMT')) {
		return '';
	}
	// GMT+02:00 or GMT-5:00 or GMT+2:00 -> normalize to +02:00 or -05:00
	const sign = part.includes('-') ? '-' : '+';
	const rest = part.replace(/^GMT[+-]/, '');
	const [hStr, mStr] = rest.split(':');
	const h = Math.abs(parseInt(hStr ?? '0', 10));
	const m = mStr !== undefined ? parseInt(mStr, 10) : 0;
	return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const getTimeZoneNames = (): string[] => {
	const intl = Intl as typeof Intl & { supportedValuesOf?(key: 'timeZone'): string[] };
	if (typeof intl.supportedValuesOf === 'function') {
		return intl.supportedValuesOf('timeZone');
	}
	// Fallback for older runtimes: return common zones (guessTimezone() will still work)
	return [];
};

export const guessTimezoneFromOffset = (offset: string | number): string => {
	const target = padOffset(offset);
	const names = getTimeZoneNames();
	if (names.length === 0) {
		return guessTimezone();
	}
	const now = new Date();
	const found = names.find((tz) => getTimezoneOffsetString(tz, now) === target);
	return found || guessTimezone();
};

export const guessTimezone = (): string => {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
	} catch {
		return 'UTC';
	}
};
