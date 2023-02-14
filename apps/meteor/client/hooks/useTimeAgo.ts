import moment from 'moment';
import { useCallback } from 'react';

export const useTimeAgo = (): ((time: Date | number | string) => string) =>
	useCallback((time) => moment(time).calendar(null, { sameDay: 'LT', lastWeek: 'dddd LT', sameElse: 'LL' }), []);

export const useShortTimeAgo = (): ((time: Date | string | number) => string) =>
	useCallback(
		(time) =>
			moment(time).calendar(null, {
				sameDay: 'LT',
				lastDay: '[Yesterday]',
				lastWeek: 'dddd',
				sameElse(now) {
					/*
					Using only this.isBefore():

					ERRORS:
						Cannot invoke an object which is possibly 'undefined'.
						This expression is not callable.
						Not all constituents of type 'CalendarSpecVal' are callable.
						Type 'string' has no call signatures.
					*/
					if ((this as unknown as moment.Moment).isBefore(now, 'year')) {
						return 'LL';
					}
					return 'MMM Do';
				},
			}),
		[],
	);
