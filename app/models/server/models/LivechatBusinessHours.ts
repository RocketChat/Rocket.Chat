import { ObjectId } from 'mongodb';

import { Base } from './_Base';
import { LivechatBussinessHourTypes } from '../../../../definition/ILivechatBusinessHour';

export class LivechatBusinessHours extends Base {
	constructor() {
		super('livechat_business_hours');

		if (this.find({ type: LivechatBussinessHourTypes.SINGLE }).count() === 0) {
			this.insert({
				_id: new ObjectId().toHexString(),
				name: '',
				active: true,
				type: LivechatBussinessHourTypes.SINGLE,
				ts: new Date(),
				workHours: [
					{ day: 'Monday', start: '08:00', finish: '20:00', code: 1, open: true },
					{ day: 'Tuesday', start: '08:00', finish: '20:00', code: 2, open: true },
					{ day: 'Wednesday', start: '08:00', finish: '20:00', code: 2, open: true },
					{ day: 'Thursday', start: '08:00', finish: '20:00', code: 2, open: true },
					{ day: 'Friday', start: '08:00', finish: '20:00', code: 2, open: true },
					{ day: 'Saturday', start: '08:00', finish: '20:00', code: 2, open: true },
					{ day: 'Sunday', start: '08:00', finish: '20:00', code: 2, open: true },
				],
			});
		}
	}
}

export default new LivechatBusinessHours();
