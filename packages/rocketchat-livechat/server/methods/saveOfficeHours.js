import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.methods({
	'livechat:saveOfficeHours'(day, start, finish, open) {
		RocketChat.models.LivechatOfficeHour.updateHours(day, start, finish, open);
	},
});
