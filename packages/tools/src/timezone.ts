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
// When Windows or browsers report these identifiers or un-updated seasonal IANA zones,
// map them to their year-round canonical equivalents without seasonal fall-back.
const WINDOWS_AND_REGIONAL_TO_CANONICAL: Record<string, string> = {
	// British Columbia (Permanent UTC-07:00)
	'British Columbia Standard Time': 'America/Dawson_Creek',
	'Pacific Time (British Columbia)': 'America/Dawson_Creek',
	'(UTC-07:00) Pacific Time (British Columbia)': 'America/Dawson_Creek',

	// Alberta (Permanent UTC-06:00)
	'Alberta Standard Time': 'America/Regina',
	'Mountain Time (Alberta)': 'America/Regina',
	'(UTC-06:00) Mountain Time (Alberta)': 'America/Regina',

	// Manitoba (Permanent UTC-05:00)
	'Manitoba Standard Time': 'America/Atikokan',
	'Central Time (Manitoba)': 'America/Atikokan',
	'Manitoba': 'America/Atikokan',
	'(UTC-05:00) Central Time (Manitoba)': 'America/Atikokan',

	// Yukon (Permanent UTC-07:00)
	'Yukon Standard Time': 'America/Whitehorse',
	'(UTC-07:00) Yukon': 'America/Whitehorse',

	// Saskatchewan (Permanent UTC-06:00)
	'Canada Central Standard Time': 'America/Regina',
	'(UTC-06:00) Saskatchewan': 'America/Regina',
};

export const canonicalizeTimezone = (name: string): string => {
	if (!name) {
		return name;
	}

	const trimmed = name.trim();
	if (WINDOWS_AND_REGIONAL_TO_CANONICAL[trimmed]) {
		return WINDOWS_AND_REGIONAL_TO_CANONICAL[trimmed];
	}

	try {
		const resolved = new Intl.DateTimeFormat(undefined, { timeZone: trimmed }).resolvedOptions().timeZone;
		return WINDOWS_AND_REGIONAL_TO_CANONICAL[resolved] ?? LEGACY_TO_CANONICAL[resolved] ?? resolved;
	} catch {
		return WINDOWS_AND_REGIONAL_TO_CANONICAL[trimmed] ?? name;
	}
};

export const getTimezoneNames = (): string[] => {
	const intl = Intl as typeof Intl & { supportedValuesOf?(key: 'timeZone'): string[] };
	const zones = typeof intl.supportedValuesOf === 'function' ? intl.supportedValuesOf('timeZone') : [];
	return zones.map((name) => WINDOWS_AND_REGIONAL_TO_CANONICAL[name] ?? LEGACY_TO_CANONICAL[name] ?? name).sort();
};

export const getTimezoneOffsetHours = (tz?: string, date = new Date()): number => {
	if (!tz || tz === 'local') {
		return -date.getTimezoneOffset() / 60;
	}

	try {
		const canonical = canonicalizeTimezone(tz);
		const formatter = new Intl.DateTimeFormat('en-US', { timeZone: canonical, timeZoneName: 'shortOffset' });
		const parts = formatter.formatToParts(date);
		const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
		const match = tzPart.match(/^GMT([+-]\d{1,2}(?::(\d{2}))?)?$/);
		if (!match) {
			return -date.getTimezoneOffset() / 60;
		}
		const tzHours = match[1] ? parseInt(match[1], 10) : 0;
		const tzMinutes = match[2] ? parseInt(match[2], 10) * (tzHours < 0 ? -1 : 1) : 0;
		return tzHours + tzMinutes / 60;
	} catch {
		return -date.getTimezoneOffset() / 60;
	}
};

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
			return WINDOWS_AND_REGIONAL_TO_CANONICAL[tz] ?? LEGACY_TO_CANONICAL[tz] ?? tz;
		}
	}

	// Fallback to Etc/GMT when no geographic zone matches
	const intHours = Math.trunc(hours);
	if (intHours === 0) {
		return 'Etc/GMT';
	}
	return `Etc/GMT${intHours > 0 ? '-' : '+'}${Math.abs(intHours)}`;
};

export const guessTimezone = (): string => {
	let resolved: string;
	try {
		resolved = new Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch {
		resolved = 'UTC';
	}

	if (WINDOWS_AND_REGIONAL_TO_CANONICAL[resolved]) {
		return WINDOWS_AND_REGIONAL_TO_CANONICAL[resolved];
	}

	const canonical = LEGACY_TO_CANONICAL[resolved] ?? resolved;

	// Check if browser mapped to seasonal Canadian zone but system offset indicates permanent DST
	try {
		const systemOffsetMinutes = new Date().getTimezoneOffset(); // e.g. 420 for UTC-7
		if (canonical === 'America/Vancouver' && systemOffsetMinutes === 420) {
			return 'America/Dawson_Creek';
		}
		if (canonical === 'America/Edmonton' && systemOffsetMinutes === 360) {
			return 'America/Regina';
		}
		if (canonical === 'America/Winnipeg' && systemOffsetMinutes === 300) {
			return 'America/Atikokan';
		}
	} catch {
		// ignore
	}

	return canonical;
};
