import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import type { Moment, MomentInput } from 'moment';
import moment from 'moment';

import { settings } from '../../../app/settings/client';
import { t } from '../../../app/utils/client';
import { getUserPreference } from '../../../app/utils/lib/getUserPreference';

const dayFormat = ['h:mm A', 'H:mm'];

export const timeAgo = (date: MomentInput): string => {
	const clockMode = Tracker.nonreactive(() => getUserPreference(Meteor.userId(), 'clockMode', false) as number | boolean);
	const messageTimeFormat = Tracker.nonreactive(() => settings.get('Message_TimeFormat'));
	const sameDay = (typeof clockMode === 'number' ? dayFormat[clockMode - 1] : undefined) || messageTimeFormat;

	return moment(date).calendar(null, {
		lastDay: `[${t('yesterday')}]`,
		sameDay,
		lastWeek: 'dddd',
		sameElse(this: Moment, now) {
			const diff = Math.ceil(this.diff(now, 'years', true));
			return diff < 0 ? 'MMM D YYYY' : 'MMM D';
		},
	});
};
