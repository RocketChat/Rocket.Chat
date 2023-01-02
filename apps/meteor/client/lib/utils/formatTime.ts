import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import type { MomentInput } from 'moment';
import moment from 'moment';

import { settings } from '../../../app/settings/client';
import { getUserPreference } from '../../../app/utils/lib/getUserPreference';

const dayFormat = ['h:mm A', 'H:mm'];

export const formatTime = (time: MomentInput): string => {
	const clockMode = Tracker.nonreactive(() => getUserPreference(Meteor.userId(), 'clockMode', false) as number | boolean);
	const messageTimeFormat = Tracker.nonreactive(() => settings.get('Message_TimeFormat'));

	switch (clockMode) {
		case 1:
		case 2: {
			const sameDay = dayFormat[clockMode - 1] || messageTimeFormat;
			return moment(time).format(sameDay);
		}

		default:
			return moment(time).format(messageTimeFormat);
	}
};
