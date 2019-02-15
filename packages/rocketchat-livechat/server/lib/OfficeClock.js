// Every minute check if office closed
import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { LivechatOfficeHour } from '../models';

Meteor.setInterval(function() {
	if (RocketChat.settings.get('Livechat_enable_office_hours')) {
		if (LivechatOfficeHour.isOpeningTime()) {
			RocketChat.models.Users.openOffice();
		} else if (LivechatOfficeHour.isClosingTime()) {
			RocketChat.models.Users.closeOffice();
		}
	}
}, 60000);
