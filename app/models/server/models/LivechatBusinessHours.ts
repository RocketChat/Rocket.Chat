import { ObjectId } from 'mongodb';

import { getDateWithUTC, getDateWithFormat, getDate, guessTimeZoneDate, utcOffsetDate } from '../../../../lib/rocketchat-dates';
import { Base } from './_Base';
import { ILivechatBusinessHour, LivechatBusinessHourTypes } from '../../../../definition/ILivechatBusinessHour';

export const createDefaultBusinessHourRow = (): ILivechatBusinessHour => {
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const closedDays = ['Saturday', 'Sunday'];
	return {
		_id: new ObjectId().toHexString(),
		name: '',
		active: true,
		type: LivechatBusinessHourTypes.DEFAULT,
		ts: new Date(),
		workHours: days.map((day, index) => ({
			day,
			start: {
				time: '08:00',
				utc: {
					dayOfWeek: getDateWithFormat(getDateWithUTC(getDate(`${ day }:08:00`, 'dddd:HH:mm')), 'dddd'),
					time: getDateWithFormat(getDateWithUTC(getDate(`${ day }:08:00`, 'dddd:HH:mm')), 'HH:mm'),
				},
				cron: {
					dayOfWeek: getDateWithFormat(getDate(`${ day }:08:00`, 'dddd:HH:mm'), 'dddd'),
					time: getDateWithFormat(getDate(`${ day }:08:00`, 'dddd:HH:mm'), 'HH:mm'),
				},
			},
			finish: {
				time: '20:00',
				utc: {
					dayOfWeek: getDateWithFormat(getDateWithUTC(getDate(`${ day }:20:00`, 'dddd:HH:mm')), 'dddd'),
					time: getDateWithFormat(getDateWithUTC(getDate(`${ day }:20:00`, 'dddd:HH:mm')), 'HH:mm'),
				},
				cron: {
					dayOfWeek: getDateWithFormat(getDate(`${ day }:20:00`, 'dddd:HH:mm'), 'dddd'),
					time: getDateWithFormat(getDate(`${ day }:20:00`, 'dddd:HH:mm'), 'HH:mm'),
				},
			},
			code: index + 1,
			open: !closedDays.includes(day),
		})),
		timezone: {
			name: guessTimeZoneDate(),
			utc: String(utcOffsetDate(getDate()) / 60),
		},
	};
};

export class LivechatBusinessHours extends Base {
	constructor() {
		super('livechat_business_hours');

		this.tryEnsureIndex({ name: 1 }, { unique: true });
	}
}

export default new LivechatBusinessHours();
