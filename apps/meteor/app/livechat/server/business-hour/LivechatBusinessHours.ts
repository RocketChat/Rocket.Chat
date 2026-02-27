import type { ILivechatBusinessHour } from '@rocket.chat/core-typings';
import { LivechatBusinessHourTypes } from '@rocket.chat/core-typings';
import { ObjectId } from 'mongodb';

import { guessTimezone } from '@rocket.chat/tools';

import { formatUtcDayTime, parseDayTimeInZone } from './AbstractBusinessHour';

export const createDefaultBusinessHourRow = (): ILivechatBusinessHour => {
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const closedDays = ['Saturday', 'Sunday'];
	const tz = guessTimezone();
	const now = new Date();
	const offsetMin = -now.getTimezoneOffset();
	const sign = offsetMin >= 0 ? '+' : '-';
	const h = Math.floor(Math.abs(offsetMin) / 60);
	const m = Math.abs(offsetMin) % 60;
	const utcStr = `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
	return {
		_id: new ObjectId().toHexString(),
		name: '',
		active: true,
		type: LivechatBusinessHourTypes.DEFAULT,
		ts: new Date(),
		workHours: days.map((day, index) => {
			const startUtc = formatUtcDayTime(parseDayTimeInZone(day, '08:00', tz));
			const finishUtc = formatUtcDayTime(parseDayTimeInZone(day, '20:00', tz));
			return {
				day,
				start: {
					time: '08:00',
					utc: { dayOfWeek: startUtc.ddd, time: startUtc.time },
					cron: { dayOfWeek: day, time: '08:00' },
				},
				finish: {
					time: '20:00',
					utc: { dayOfWeek: finishUtc.ddd, time: finishUtc.time },
					cron: { dayOfWeek: day, time: '20:00' },
				},
				code: index + 1,
				open: !closedDays.includes(day),
			};
		}),
		timezone: {
			name: tz,
			utc: utcStr,
		},
	};
};
