import moment from 'moment';

import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { getUserPreference, t } from '../../../utils';
import { settings } from '../../../settings';

let lastDay = t('yesterday');
let clockMode;
let sameDay;
const dayFormat = ['h:mm A', 'H:mm'];

Meteor.startup(() => Tracker.autorun(() => {
	clockMode = getUserPreference(Meteor.userId(), 'clockMode', false);
	sameDay = dayFormat[clockMode - 1] || 'h:mm A';
	lastDay = t('yesterday');
}));

export const formatTime = (time) => {
	switch (clockMode) {
		case 1:
		case 2:
			return moment(time).format(sameDay);
		default:
			return moment(time).format(settings.get('Message_TimeFormat'));
	}
};

export const formatDateAndTime = (time) => {
	switch (clockMode) {
		case 1:
			return moment(time).format('MMMM D, Y h:mm A');
		case 2:
			return moment(time).format('MMMM D, Y H:mm');
		default:
			return moment(time).format(settings.get('Message_TimeAndDateFormat'));
	}
};

const sameElse = function(now) {
	const diff = Math.ceil(this.diff(now, 'years', true));
	return diff < 0 ? 'MMM D YYYY' : 'MMM D';
};

export const timeAgo = (date) => moment(date).calendar(null, {
	lastDay: `[${ lastDay }]`,
	sameDay,
	lastWeek: 'dddd',
	sameElse,
});

export const formatDate = (time) => moment(time).format(settings.get('Message_DateFormat'));
