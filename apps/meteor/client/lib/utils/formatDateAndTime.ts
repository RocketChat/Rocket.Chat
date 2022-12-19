import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import type { MomentInput } from 'moment';
import moment from 'moment';

import { settings } from '../../../app/settings/client';
import { getUserPreference } from '../../../app/utils/lib/getUserPreference';

export const formatDateAndTime = (time: MomentInput): string => {
	const clockMode = Tracker.nonreactive(() => getUserPreference(Meteor.userId(), 'clockMode', false) as number | boolean);
	const messageTimeAndDateFormat = Tracker.nonreactive(() => settings.get('Message_TimeAndDateFormat'));

	switch (clockMode) {
		case 1:
			return moment(time).format('MMMM D, Y h:mm A');
		case 2:
			return moment(time).format('MMMM D, Y H:mm');
		default:
			return moment(time).format(messageTimeAndDateFormat);
	}
};
