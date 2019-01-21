import { Meteor } from 'meteor/meteor';
import { getUserPreference } from 'meteor/rocketchat:utils';
import { settings } from 'meteor/rocketchat:settings';
import moment from 'moment';

export const formatTime = (time) => {
	switch (getUserPreference(Meteor.userId(), 'clockMode', false)) {
		case 1:
			return moment(time).format('h:mm A');
		case 2:
			return moment(time).format('H:mm');
		default:
			return moment(time).format(settings.get('Message_TimeFormat'));
	}
};

export const formatDateAndTime = (time) => {
	switch (getUserPreference(Meteor.userId(), 'clockMode', false)) {
		case 1:
			return moment(time).format('MMMM D, Y h:mm A');
		case 2:
			return moment(time).format('MMMM D, Y H:mm');
		default:
			return moment(time).format(settings.get('Message_TimeAndDateFormat'));
	}
};

export const formatDate = (time) => moment(time).format(settings.get('Message_DateFormat'));
