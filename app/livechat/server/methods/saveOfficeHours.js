import { Meteor } from 'meteor/meteor';

import { LivechatOfficeHour } from '../../../models';

Meteor.methods({
	'livechat:saveOfficeHours'(day, start, finish, open) {
		console.log('Method "livechat:saveOfficeHour" is deprecated and will be removed after v4.0.0');
		LivechatOfficeHour.updateHours(day, start, finish, open);
	},
});
