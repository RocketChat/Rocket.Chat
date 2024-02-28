import moment from 'moment-timezone';

const padOffset = (offset: string | number): string => {
	const numberOffset = Number(offset);
	const absOffset = Math.abs(numberOffset);
	const isNegative = !(numberOffset === absOffset);

	return `${isNegative ? '-' : '+'}${absOffset < 10 ? `0${absOffset}` : absOffset}:00`;
};

export const guessTimezoneFromOffset = (offset: string | number): string =>
	moment.tz.names().find((tz) => padOffset(offset) === moment.tz(tz).format('Z').toString()) || moment.tz.guess();

export const guessTimezone = (): string => moment.tz.guess();
