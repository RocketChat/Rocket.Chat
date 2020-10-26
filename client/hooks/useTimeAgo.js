import { useCallback } from 'react';
import moment from 'moment';

export const useTimeAgo = () => useCallback((time) => moment(time).calendar(null, { sameDay: 'LT', lastWeek: 'dddd LT', sameElse: 'LL' }), []);

export const useShortTimeAgo = () => useCallback((time) => moment(time).calendar(null, {
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
