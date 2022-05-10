import moment from 'moment-timezone';
import { Mongo } from 'meteor/mongo';
import { ILivechatBusinessHour, IBusinessHourWorkHour, LivechatBusinessHourTypes } from '@rocket.chat/core-typings';

import { addMigration } from '../../lib/migrations';
import { LivechatBusinessHours, Permissions, Settings } from '../../../app/models/server/raw';

const migrateCollection = async (): Promise<void> => {
	const LivechatOfficeHour = new Mongo.Collection<IBusinessHourWorkHour>('rocketchat_livechat_office_hour');
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const officeHours: IBusinessHourWorkHour[] = [];
	days.forEach((day) => {
		const officeHour = LivechatOfficeHour.findOne({ day });
		if (officeHour) {
			officeHours.push(officeHour);
		}
	});

	if (!officeHours || officeHours.length === 0) {
		return;
	}

	const businessHour: Omit<ILivechatBusinessHour, '_id'> = {
		name: '',
		active: true,
		type: LivechatBusinessHourTypes.DEFAULT,
		ts: new Date(),
		workHours: officeHours.map(
			(officeHour): IBusinessHourWorkHour => ({
				day: officeHour.day,
				start: {
					time: officeHour.start as any,
					utc: {
						dayOfWeek: moment(`${officeHour.day}:${officeHour.start}`, 'dddd:HH:mm').utc().format('dddd'),
						time: moment(`${officeHour.day}:${officeHour.start}`, 'dddd:HH:mm').utc().format('HH:mm'),
					},
					cron: {
						dayOfWeek: moment(`${officeHour.day}:${officeHour.start}`, 'dddd:HH:mm').format('dddd'),
						time: moment(`${officeHour.day}:${officeHour.start}`, 'dddd:HH:mm').format('HH:mm'),
					},
				},
				finish: {
					time: officeHour.finish as any,
					utc: {
						dayOfWeek: moment(`${officeHour.day}:${officeHour.finish}`, 'dddd:HH:mm').utc().format('dddd'),
						time: moment(`${officeHour.day}:${officeHour.finish}`, 'dddd:HH:mm').utc().format('HH:mm'),
					},
					cron: {
						dayOfWeek: moment(`${officeHour.day}:${officeHour.finish}`, 'dddd:HH:mm').format('dddd'),
						time: moment(`${officeHour.day}:${officeHour.finish}`, 'dddd:HH:mm').format('HH:mm'),
					},
				},
				code: officeHour.code,
				open: officeHour.open,
			}),
		),
		timezone: {
			name: moment.tz.guess(),
			utc: String(moment().utcOffset() / 60),
		},
	};
	if ((await LivechatBusinessHours.find({ type: LivechatBusinessHourTypes.DEFAULT }).count()) === 0) {
		LivechatBusinessHours.insertOne(businessHour);
	} else {
		LivechatBusinessHours.update({ type: LivechatBusinessHourTypes.DEFAULT }, { $set: { ...businessHour } });
	}
	try {
		Promise.await(LivechatOfficeHour.rawCollection().drop());
	} catch (err) {
		// Ignore if the collection does not exist
		if (!err.code || err.code !== 26) {
			throw err;
		}
	}
};

addMigration({
	version: 195,
	async up() {
		await Settings.removeById('Livechat_enable_office_hours');
		await Settings.removeById('Livechat_allow_online_agents_outside_office_hours');
		const permission = await Permissions.findOneById('view-livechat-officeHours');
		if (permission) {
			await Permissions.update({ _id: 'view-livechat-business-hours' }, { $set: { roles: permission.roles } }, { upsert: true });
			await Permissions.deleteOne({ _id: 'view-livechat-officeHours' });
		}
		await migrateCollection();
	},
});
