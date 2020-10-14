import moment from 'moment-timezone';
import { ObjectId } from 'mongodb';
import { Mongo } from 'meteor/mongo';

import { Migrations } from '../../../app/migrations/server';
import { Permissions, Settings } from '../../../app/models/server';
import { LivechatBusinessHours } from '../../../app/models/server/raw';
import { LivechatBusinessHourTypes } from '../../../definition/ILivechatBusinessHour';

const migrateCollection = () => {
	const LivechatOfficeHour = new Mongo.Collection('rocketchat_livechat_office_hour');
	const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
	const officeHours = [];
	days.forEach((day) => {
		const officeHour = LivechatOfficeHour.findOne({ day });
		if (officeHour) {
			officeHours.push(officeHour);
		}
	});

	if (!officeHours || officeHours.length === 0) {
		return;
	}

	const businessHour = {
		name: '',
		active: true,
		type: LivechatBusinessHourTypes.DEFAULT,
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
				time: officeHour.finish,
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
			name: moment.tz.guess(),
			utc: moment().utcOffset() / 60,
		},
	};
	if (LivechatBusinessHours.find({ type: LivechatBusinessHourTypes.DEFAULT }).count() === 0) {
		businessHour._id = new ObjectId().toHexString();
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
