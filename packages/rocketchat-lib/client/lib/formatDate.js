import { Meteor } from 'meteor/meteor';
import moment from 'moment';
import mem from 'mem';


const clockMode = mem(() => RocketChat.getUserPreference(Meteor.userId(), 'clockMode', false), { maxAge: 1000 });

export const formatTime = (time) => {
	switch (clockMode()) {
		case 1:
			return moment(time).format('h:mm A');
		case 2:
			return moment(time).format('H:mm');
		default:
			return moment(time).format(RocketChat.settings.get('Message_TimeFormat'));
	}
};

export const formatDateAndTime = (time) => {
	switch (clockMode()) {
		case 1:
			return moment(time).format('MMMM D, Y h:mm A');
		case 2:
			return moment(time).format('MMMM D, Y H:mm');
		default:
			return moment(time).format(RocketChat.settings.get('Message_TimeAndDateFormat'));
	}
};

export const formatDate = (time) => moment(time).format(RocketChat.settings.get('Message_DateFormat'));
