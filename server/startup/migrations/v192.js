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
			start: officeHour.start,
			finish: officeHour.finish,
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
	return LivechatOfficeHour.rawCollection().drop();
};

Migrations.add({
	version: 192,
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
