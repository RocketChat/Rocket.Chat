import { Meteor } from 'meteor/meteor';

import { LivechatBusinessHours } from '../../../models/server/raw';

Meteor.methods({
	'livechat:saveOfficeHours'(day, start, finish, open) {
		console.log('Method "livechat:saveOfficeHour" is deprecated and will be removed after v4.0.0');
		LivechatBusinessHours.updateDayOfGlobalBusinessHour({
			day,
			start,
			finish,
			open,
		});
	},
});
