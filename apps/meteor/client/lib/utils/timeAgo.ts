import { Tracker } from 'meteor/tracker';

import { getUserPreference } from '../../../app/utils/client';
import { t } from '../../../app/utils/lib/i18n';
import { settings } from '../settings';
import { getUserId } from '../user';
import { formatTimeAgo } from './dateFormat';

const dayFormat = ['h:mm A', 'H:mm'];

export const timeAgo = (date: string | Date | number) => {
	const clockMode = Tracker.nonreactive(() => getUserPreference(getUserId(), 'clockMode', false) as number | boolean);
	const messageTimeFormat = settings.peek('Message_TimeFormat');
	const sameDay = (typeof clockMode === 'number' ? dayFormat[clockMode - 1] : undefined) || messageTimeFormat;

	return formatTimeAgo(date, {
		yesterdayLabel: `[${t('yesterday')}]`,
		sameDayFormat: sameDay,
		lastWeekFormat: 'dddd',
		otherFormat: 'MMM d',
		otherYearFormat: 'MMM d yyyy',
	});
};
