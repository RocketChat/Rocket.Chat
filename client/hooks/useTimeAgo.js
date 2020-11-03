import { useCallback } from 'react';

import { getDateCalendar, getDate } from '../../lib/rocketchat-dates';

export const useTimeAgo = () => useCallback((time) => getDateCalendar(getDate(time), null, { sameDay: 'LT', lastWeek: 'dddd LT', sameElse: 'LL' }), []);

export const useShortTimeAgo = () => useCallback((time) => getDateCalendar(getDate(time), null, {
	sameDay: 'LT',
	lastDay: '[Yesterday]',
	lastWeek: 'dddd',
	sameElse(now) {
		if (this.isBefore(now, 'year')) {
			return 'LL';
		}
		return 'MMM Do';
	},
}), []);
