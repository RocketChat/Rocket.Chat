import moment from 'moment';
import { ObjectId } from 'mongodb';
import { Mongo } from 'meteor/mongo';

import { Migrations } from '../../../app/migrations/server';
import { Permissions, Settings } from '../../../app/models/server';
import { LivechatBusinessHours } from '../../../app/models/server/raw';
import { LivechatBussinessHourTypes } from '../../../definition/ILivechatBusinessHour';

const migrateCollection = () => {
	const LivechatOfficeHour = new Mongo.Collection('rocketchat_livechat_office_hour');
	const officeHours = Promise.await(LivechatOfficeHour.rawCollection().find().toArray());
	const businessHour = {
		name: '',
		active: true,
		type: LivechatBussinessHourTypes.SINGLE,
		ts: new Date(),
		workHours: officeHours.map((officeHour) => ({
			day: officeHour.day,
			start: {
				time: officeHour.start,
				utc: {
					dayOfWeek: moment(`${ officeHour.day }:${ officeHour.start }`, 'dddd:HH:mm').utc().format('dddd'),
					time: moment(`${ officeHour.day }:${ officeHour.start }`, 'dddd:HH:mm').utc().format('HH:mm'),
				},
				cron: {
					dayOfWeek: moment(`${ officeHour.day }:${ officeHour.start }`, 'dddd:HH:mm').format('dddd'),
					time: moment(`${ officeHour.day }:${ officeHour.start }`, 'dddd:HH:mm').format('HH:mm'),
				},
			},
			finish: {
				time: '20:00',
				utc: {
					dayOfWeek: moment(`${ officeHour.day }:${ officeHour.finish }`, 'dddd:HH:mm').utc().format('dddd'),
					time: moment(`${ officeHour.day }:${ officeHour.finish }`, 'dddd:HH:mm').utc().format('HH:mm'),
				},
				cron: {
					dayOfWeek: moment(`${ officeHour.day }:${ officeHour.finish }`, 'dddd:HH:mm').format('dddd'),
					time: moment(`${ officeHour.day }:${ officeHour.finish }`, 'dddd:HH:mm').format('HH:mm'),
				},
			},
			code: officeHour.code,
			open: officeHour.open,
		})),
		timezone: {
			name: '',
			utc: moment().utcOffset() / 60,
		},
	};
	if (LivechatBusinessHours.find({ type: LivechatBussinessHourTypes.SINGLE }).count() === 0) {
		businessHour._id = new ObjectId().toHexString();
		LivechatBusinessHours.insertOne(businessHour);
	} else {
		LivechatBusinessHours.update({ type: LivechatBussinessHourTypes.SINGLE }, businessHour);
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

Migrations.add({
	version: 195,
	up() {
		Settings.remove({ _id: 'Livechat_enable_office_hours' });
		Settings.remove({ _id: 'Livechat_allow_online_agents_outside_office_hours' });
		const permission = Permissions.findOneById('view-livechat-officeHours');
		if (permission) {
			Permissions.upsert({ _id: 'view-livechat-business-hours' }, { $set: { roles: permission.roles } });
			Permissions.remove({ _id: 'view-livechat-officeHours' });
		}
		Promise.await(migrateCollection());
	},
});
