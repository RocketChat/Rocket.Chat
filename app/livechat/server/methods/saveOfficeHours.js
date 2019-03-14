import { Meteor } from 'meteor/meteor';
import { LivechatOfficeHour } from '/app/models';

Meteor.methods({
	'livechat:saveOfficeHours'(day, start, finish, open) {
		LivechatOfficeHour.updateHours(day, start, finish, open);
	},
});
