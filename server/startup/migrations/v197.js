import { guessTimeZoneDate, getDate, utcOffsetDate } from '../../../lib/rocketchat-dates';
import { Migrations } from '../../../app/migrations/server';
import { LivechatBusinessHours } from '../../../app/models/server/raw';
import { LivechatBusinessHourTypes } from '../../../definition/ILivechatBusinessHour';

const updateBusinessHours = async () => {
	await LivechatBusinessHours.update({ type: 'multiple' }, {
		$set: {
			type: LivechatBusinessHourTypes.CUSTOM,
		},
	}, { multi: true });

	const defaultBusinessHour = await LivechatBusinessHours.findOne({ $or: [{ type: 'single' }, { type: 'default' }] });
	if (!defaultBusinessHour) {
		return;
	}

	await LivechatBusinessHours.update({ _id: defaultBusinessHour._id }, {
		$set: {
			type: LivechatBusinessHourTypes.DEFAULT,
			timezone: {
				name: guessTimeZoneDate(),
				utc: String(utcOffsetDate(getDate()) / 60),
			},
		},
	});
};

Migrations.add({
	version: 197,
	up() {
		Promise.await(updateBusinessHours());
	},
});
