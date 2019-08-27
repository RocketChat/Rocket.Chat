import { Meteor } from 'meteor/meteor';

import { LivechatOfficeHour } from '../../../models';

Meteor.methods({
	'livechat:saveOfficeHours'(day, start, finish, open) {
		LivechatOfficeHour.updateHours(day, start, finish, open);
	},
});
