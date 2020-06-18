import moment from 'moment';
import { ObjectId } from 'mongodb';

import { Base } from './_Base';
import { ILivechatBusinessHour, LivechatBussinessHourTypes } from '../../../../definition/ILivechatBusinessHour';

const createDefaultBusinessHour = (): ILivechatBusinessHour => {
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const closedDays = ['Saturday', 'Sunday'];
	return {
		_id: new ObjectId().toHexString(),
		name: '',
		active: true,
		type: LivechatBussinessHourTypes.SINGLE,
		ts: new Date(),
		workHours: days.map((day, index) => ({
			day,
			start: '08:00',
			finish: '20:00',
			code: index + 1,
			open: !closedDays.includes(day),
		})),
		timezone: {
			name: '',
			utc: String(moment().utcOffset() / 60),
		},
	};
};

export class LivechatBusinessHours extends Base {
	constructor() {
		super('livechat_business_hours');

		this.tryEnsureIndex({ name: 1 }, { unique: true });

		if (this.find({ type: LivechatBussinessHourTypes.SINGLE }).count() === 0) {
			this.insert(createDefaultBusinessHour());
		}
	}
}

export default new LivechatBusinessHours();
