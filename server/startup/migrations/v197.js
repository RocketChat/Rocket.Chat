import moment from 'moment-timezone';

import { Migrations } from '../../../app/migrations/server';
import { LivechatBusinessHours } from '../../../app/models/server/raw';
import { LivechatBusinessHourTypes } from '../../../definition/ILivechatBusinessHour';

const updateBusinessHours = async () => {
	const defaultBusinessHour = await LivechatBusinessHours.findOne({ $or: [{ type: 'single' }, { type: 'default' }] });
	await LivechatBusinessHours.update({ _id: defaultBusinessHour._id }, {
		$set: {
			type: LivechatBusinessHourTypes.DEFAULT,
			timezone: {
				name: moment.tz.guess(),
				utc: String(moment().utcOffset() / 60),
			},
		},
	});
	await LivechatBusinessHours.update({ type: 'multiple' }, {
		$set: {
			type: LivechatBusinessHourTypes.CUSTOM,
		},
	}, { multi: true });
};

Migrations.add({
	version: 197,
	up() {
		Promise.await(updateBusinessHours());
	},
});
