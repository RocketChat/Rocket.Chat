import moment from 'moment-timezone';

import { Migrations } from '../../../app/migrations/server';
import { LivechatBusinessHours } from '../../../app/models/server/raw';
import { LivechatBussinessHourTypes } from '../../../definition/ILivechatBusinessHour';

const updateBusinessHours = async () => {
	const defaultBusinessHour = await LivechatBusinessHours.findOne({ type: 'single' });
	await LivechatBusinessHours.update({ _id: defaultBusinessHour._id }, {
		$set: {
			type: LivechatBussinessHourTypes.DEFAULT,
			timezone: {
				name: moment.tz.guess(),
				utc: String(moment().utcOffset() / 60),
			},
		},
	});
	await LivechatBusinessHours.update({ type: 'multiple' }, {
		$set: {
			type: LivechatBussinessHourTypes.CUSTOM,
		},
	}, { multi: true });
};

Migrations.add({
	version: 197,
	up() {
		Promise.await(updateBusinessHours());
	},
});
