import moment from 'moment-timezone';
import { SettingValue } from '@rocket.chat/core-typings';

import { settings } from '../../../settings/server';

const padOffset = (offset: string | number): string => {
	const numberOffset = Number(offset);
	const absOffset = Math.abs(numberOffset);
	const isNegative = !(numberOffset === absOffset);

	return `${isNegative ? '-' : '+'}${absOffset < 10 ? `0${absOffset}` : absOffset}:00`;
};

const guessTimezoneFromOffset = (offset: string | number): string =>
	moment.tz.names().find((tz) => padOffset(offset) === moment.tz(tz).format('Z').toString()) || moment.tz.guess();

export const getTimezone = (user: { utcOffset: string | number }): string | void | SettingValue => {
	const timezone = settings.get('Default_Timezone_For_Reporting');

	switch (timezone) {
		case 'custom':
			return settings.get('Default_Custom_Timezone');
		case 'user':
			return guessTimezoneFromOffset(user.utcOffset);
		default:
			return moment.tz.guess();
	}
};
