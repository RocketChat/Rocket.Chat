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

export const canonicalizeTimezone = (name: string): string => {
	try {
		const resolved = new Intl.DateTimeFormat(undefined, { timeZone: name }).resolvedOptions().timeZone;
		return LEGACY_TO_CANONICAL[resolved] ?? resolved;
	} catch {
		return name;
	}
};

export const getTimezoneNames = (): string[] => {
	const intl = Intl as typeof Intl & { supportedValuesOf?(key: 'timeZone'): string[] };
	const zones = typeof intl.supportedValuesOf === 'function' ? intl.supportedValuesOf('timeZone') : [];
	return zones.map((name) => LEGACY_TO_CANONICAL[name] ?? name).sort();
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
			return LEGACY_TO_CANONICAL[tz] ?? tz;
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
	const resolved = new Intl.DateTimeFormat().resolvedOptions().timeZone;
	return LEGACY_TO_CANONICAL[resolved] ?? resolved;
};
