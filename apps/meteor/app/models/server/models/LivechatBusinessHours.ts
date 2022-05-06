import moment from 'moment-timezone';
import { ObjectId } from 'mongodb';
import { ILivechatBusinessHour, LivechatBusinessHourTypes } from '@rocket.chat/core-typings';

import { Base } from './_Base';

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
					dayOfWeek: moment(`${day}:08:00`, 'dddd:HH:mm').utc().format('dddd'),
					time: moment(`${day}:08:00`, 'dddd:HH:mm').utc().format('HH:mm'),
				},
				cron: {
					dayOfWeek: moment(`${day}:08:00`, 'dddd:HH:mm').format('dddd'),
					time: moment(`${day}:08:00`, 'dddd:HH:mm').format('HH:mm'),
				},
			},
			finish: {
				time: '20:00',
				utc: {
					dayOfWeek: moment(`${day}:20:00`, 'dddd:HH:mm').utc().format('dddd'),
					time: moment(`${day}:20:00`, 'dddd:HH:mm').utc().format('HH:mm'),
				},
				cron: {
					dayOfWeek: moment(`${day}:20:00`, 'dddd:HH:mm').format('dddd'),
					time: moment(`${day}:20:00`, 'dddd:HH:mm').format('HH:mm'),
				},
			},
			code: index + 1,
			open: !closedDays.includes(day),
		})),
		timezone: {
			name: moment.tz.guess(),
			utc: String(moment().utcOffset() / 60),
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
