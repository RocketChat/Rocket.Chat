// Zones where Node/browser Intl returns a legacy IANA name instead of the
// current canonical one. Workaround until Temporal lands (~late 2026).
// Source: https://data.iana.org/time-zones/tzdb/backward
// Ref: https://github.com/tc39/proposal-temporal/issues/3249
const LEGACY_TO_CANONICAL: Record<string, string> = {
	'America/Buenos_Aires': 'America/Argentina/Buenos_Aires',
	'America/Catamarca': 'America/Argentina/Catamarca',
	'America/Cordoba': 'America/Argentina/Cordoba',
	'America/Godthab': 'America/Nuuk',
	'America/Indianapolis': 'America/Indiana/Indianapolis',
	'America/Jujuy': 'America/Argentina/Jujuy',
	'America/Louisville': 'America/Kentucky/Louisville',
	'America/Mendoza': 'America/Argentina/Mendoza',
	'Asia/Calcutta': 'Asia/Kolkata',
	'Asia/Katmandu': 'Asia/Kathmandu',
	'Asia/Rangoon': 'Asia/Yangon',
	'Asia/Saigon': 'Asia/Ho_Chi_Minh',
	'Atlantic/Faeroe': 'Atlantic/Faroe',
	'Europe/Kiev': 'Europe/Kyiv',
	'Pacific/Enderbury': 'Pacific/Kanton',
};

// Windows time zone identifiers (registry keys and display names) and Canadian
// provinces adopting permanent Daylight Saving Time (DST).
// When Windows or browsers report these identifiers, map them to their canonical
// provincial equivalents.
const WINDOWS_AND_REGIONAL_TO_CANONICAL: Record<string, string> = {
	// British Columbia
	'British Columbia Standard Time': 'America/Vancouver',
	'Pacific Time (British Columbia)': 'America/Vancouver',
	'(UTC-07:00) Pacific Time (British Columbia)': 'America/Vancouver',

	// Alberta
	'Alberta Standard Time': 'America/Edmonton',
	'Mountain Time (Alberta)': 'America/Edmonton',
	'(UTC-06:00) Mountain Time (Alberta)': 'America/Edmonton',

	// Manitoba
	'Manitoba Standard Time': 'America/Winnipeg',
	'Central Time (Manitoba)': 'America/Winnipeg',
	'Manitoba': 'America/Winnipeg',
	'(UTC-05:00) Central Time (Manitoba)': 'America/Winnipeg',

	// Yukon (Permanent UTC-07:00 since 2020)
	'Yukon Standard Time': 'America/Whitehorse',
	'(UTC-07:00) Yukon': 'America/Whitehorse',

	// Saskatchewan (Permanent UTC-06:00 since 1966)
	'Canada Central Standard Time': 'America/Regina',
	'(UTC-06:00) Saskatchewan': 'America/Regina',
};

// Canadian provinces ending seasonal clock changes in November 2026.
// Clocks were scheduled to fall back on Sunday, November 1, 2026 at 02:00 local time.
// Dates before the transition retain historical seasonal offsets; dates on or after
// retain permanent Daylight Saving Time offsets.
const BC_PERMANENT_DST_START = new Date('2026-11-01T09:00:00.000Z'); // 02:00 PDT (UTC-7)
const AB_PERMANENT_DST_START = new Date('2026-11-01T08:00:00.000Z'); // 02:00 MDT (UTC-6)
const MB_PERMANENT_DST_START = new Date('2026-11-01T07:00:00.000Z'); // 02:00 CDT (UTC-5)

export const resolveDateAwareTimezone = (tz: string, date: Date = new Date()): string => {
	const canonical = canonicalizeTimezone(tz);
	if (canonical === 'America/Vancouver') {
		return date < BC_PERMANENT_DST_START ? 'America/Vancouver' : 'America/Dawson_Creek';
	}
	if (canonical === 'America/Edmonton') {
		return date < AB_PERMANENT_DST_START ? 'America/Edmonton' : 'America/Regina';
	}
	if (canonical === 'America/Winnipeg') {
		return date < MB_PERMANENT_DST_START ? 'America/Winnipeg' : 'America/Atikokan';
	}
	return canonical;
};

export const canonicalizeTimezone = (name: string): string => {
	if (!name) {
		return name;
	}

	const trimmed = name.trim();
	if (Object.hasOwn(WINDOWS_AND_REGIONAL_TO_CANONICAL, trimmed)) {
		return WINDOWS_AND_REGIONAL_TO_CANONICAL[trimmed];
	}

	try {
		const resolved = new Intl.DateTimeFormat(undefined, { timeZone: trimmed }).resolvedOptions().timeZone;
		return (
			(Object.hasOwn(WINDOWS_AND_REGIONAL_TO_CANONICAL, resolved) && WINDOWS_AND_REGIONAL_TO_CANONICAL[resolved]) ||
			(Object.hasOwn(LEGACY_TO_CANONICAL, resolved) && LEGACY_TO_CANONICAL[resolved]) ||
			resolved
		);
	} catch {
		return Object.hasOwn(WINDOWS_AND_REGIONAL_TO_CANONICAL, trimmed) ? WINDOWS_AND_REGIONAL_TO_CANONICAL[trimmed] : name;
	}
};

export const getTimezoneNames = (): string[] => {
	const intl = Intl as typeof Intl & { supportedValuesOf?(key: 'timeZone'): string[] };
	const zones = typeof intl.supportedValuesOf === 'function' ? intl.supportedValuesOf('timeZone') : [];
	return zones.map((name) => (Object.hasOwn(LEGACY_TO_CANONICAL, name) ? LEGACY_TO_CANONICAL[name] : name)).sort();
};

export const getTimezoneOffsetHours = (tz?: string, date = new Date()): number => {
	if (!tz || tz === 'local') {
		return -date.getTimezoneOffset() / 60;
	}

	try {
		const canonical = resolveDateAwareTimezone(tz, date);
		const formatter = new Intl.DateTimeFormat('en-US', { timeZone: canonical, timeZoneName: 'shortOffset' });
		const parts = formatter.formatToParts(date);
		const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
		if (tzPart === 'GMT' || tzPart === 'UTC') {
			return 0;
		}
		const match = tzPart.match(/^GMT([+-])(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?$/);
		if (!match) {
			return -date.getTimezoneOffset() / 60;
		}
		const sign = match[1] === '-' ? -1 : 1;
		const hours = parseInt(match[2], 10);
		const minutes = match[3] ? parseInt(match[3], 10) : 0;
		const seconds = match[4] ? parseInt(match[4], 10) : 0;
		return sign * (hours + minutes / 60 + seconds / 3600);
	} catch {
		return -date.getTimezoneOffset() / 60;
	}
};

export const guessTimezoneFromOffset = (offset: string | number): string => {
	const totalMinutes = typeof offset === 'number' ? offset * 60 : parseInt(offset, 10) * 60;
	const date = new Date();

	for (const tz of getTimezoneNames()) {
		const formatter = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' });
		const parts = formatter.formatToParts(date);
		const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
		const match = tzPart.match(/^GMT([+-]\d{1,2}(?::(\d{2}))?)?$/);
		if (!match) {
			continue;
		}
		const tzHours = match[1] ? parseInt(match[1], 10) : 0;
		const tzMinutes = match[2] ? parseInt(match[2], 10) * (tzHours < 0 ? -1 : 1) : 0;
		if (tzHours * 60 + tzMinutes === totalMinutes) {
			return Object.hasOwn(LEGACY_TO_CANONICAL, tz) ? LEGACY_TO_CANONICAL[tz] : tz;
		}
	}

	// Fallback to UTC equivalent representation if no IANA named zone matched
	const sign = totalMinutes >= 0 ? '+' : '-';
	const absMinutes = Math.abs(totalMinutes);
	const hours = Math.floor(absMinutes / 60);
	const mins = absMinutes % 60;
	return mins === 0 ? `Etc/GMT${sign === '+' ? '-' : '+'}${hours}` : 'UTC';
};

export const guessTimezone = (): string => {
	let resolved: string;
	try {
		resolved = new Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch {
		resolved = 'UTC';
	}

	if (Object.hasOwn(WINDOWS_AND_REGIONAL_TO_CANONICAL, resolved)) {
		return WINDOWS_AND_REGIONAL_TO_CANONICAL[resolved];
	}

	return Object.hasOwn(LEGACY_TO_CANONICAL, resolved) ? LEGACY_TO_CANONICAL[resolved] : resolved;
};
