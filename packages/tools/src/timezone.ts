const supportedTimeZones = Intl.supportedValuesOf('timeZone');

const padOffset = (offset: string | number): string => {
	if (typeof offset === 'string') {
		const sanitized = offset.trim();
		if (/^[+-]\d{2}:\d{2}$/.test(sanitized)) {
			return sanitized;
		}
	}

	const numberOffset = Number(offset);
	if (Number.isNaN(numberOffset)) {
		return '+00:00';
	}

	const isNegative = numberOffset < 0;
	const absOffset = Math.abs(numberOffset);
	let hours = Math.floor(absOffset);
	let minutes = Math.round((absOffset - hours) * 60);

	if (minutes === 60) {
		minutes = 0;
		hours += 1;
	}

	const paddedHours = hours.toString().padStart(2, '0');
	const paddedMinutes = minutes.toString().padStart(2, '0');

	return `${isNegative ? '-' : '+'}${paddedHours}:${paddedMinutes}`;
};

const formatOffsetFromMinutes = (minutes: number): string => {
	const sign = minutes < 0 ? '-' : '+';
	const absolute = Math.abs(minutes);
	let hours = Math.floor(absolute / 60);
	let mins = Math.round(absolute - hours * 60);

	if (mins === 60) {
		mins = 0;
		hours += 1;
	}

	const paddedHours = hours.toString().padStart(2, '0');
	const paddedMinutes = mins.toString().padStart(2, '0');

	return `${sign}${paddedHours}:${paddedMinutes}`;
};

const getTimezoneOffsetString = (timeZone: string, referenceDate = new Date()): string | undefined => {
	try {
		const dtf = new Intl.DateTimeFormat('en-US', {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		});

		const parts = dtf.formatToParts(referenceDate);
		const data: Record<string, number> = {};
		for (const part of parts) {
			if (part.type !== 'literal') {
				data[part.type] = Number(part.value);
			}
		}

		const year = data.year ?? referenceDate.getUTCFullYear();
		const month = (data.month ?? referenceDate.getUTCMonth() + 1) - 1;
		const day = data.day ?? referenceDate.getUTCDate();
		const hour = data.hour ?? referenceDate.getUTCHours();
		const minute = data.minute ?? referenceDate.getUTCMinutes();
		const second = data.second ?? referenceDate.getUTCSeconds();

		const utcTime = Date.UTC(year, month, day, hour, minute, second);
		const diffMinutes = Math.round((utcTime - referenceDate.getTime()) / 60000);

		return formatOffsetFromMinutes(diffMinutes);
	} catch {
		return undefined;
	}
};

const guessEtcGmtFromOffset = (offset: string | number): string | undefined => {
	const numericOffset = Number(offset);
	if (Number.isNaN(numericOffset)) {
		return undefined;
	}

	if (numericOffset === 0) {
		return 'Etc/GMT';
	}

	const hours = Math.floor(Math.abs(numericOffset));
	if (hours > 14) {
		return undefined;
	}

	return `Etc/GMT${numericOffset > 0 ? `-${hours}` : `+${hours}`}`;
};

export const guessTimezoneFromOffset = (offset: string | number): string => {
	const normalizedOffset = padOffset(offset);
	const referenceDate = new Date();
	const match = supportedTimeZones.find((timeZone) => getTimezoneOffsetString(timeZone, referenceDate) === normalizedOffset);

	return match || guessEtcGmtFromOffset(offset) || guessTimezone();
};

export const guessTimezone = (): string => {
	return new Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
};
