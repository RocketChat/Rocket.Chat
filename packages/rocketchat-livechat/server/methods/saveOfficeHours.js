import { Meteor } from 'meteor/meteor';

Meteor.methods({
	'livechat:saveOfficeHours'(day, start, finish, open) {
		RocketChat.models.LivechatOfficeHour.updateHours(day, start, finish, open);
	},
});
