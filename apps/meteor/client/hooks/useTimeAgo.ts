import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import { useCallback } from 'react';

const dayFormat = ['h:mm A', 'H:mm'] as const;

export const useTimeAgo = (): ((time: Date | number | string) => string) => {
	const clockMode = useUserPreference<1 | 2>('clockMode');
	const timeFormat = useSetting('Message_TimeFormat') as string;
	const format = clockMode !== undefined ? dayFormat[clockMode - 1] : timeFormat;
	return useCallback(
		(time) =>
			moment(time).calendar(null, { sameDay: format, lastDay: `[Yesterday at] ${format}`, lastWeek: `dddd ${format}`, sameElse: 'LL' }),
		[],
	);
};

export const useShortTimeAgo = (): ((time: Date | string | number) => string) => {
	const clockMode = useUserPreference<1 | 2>('clockMode');
	const timeFormat = useSetting('Message_TimeFormat') as string;
	const format = clockMode !== undefined ? dayFormat[clockMode - 1] : timeFormat;
	return useCallback(
		(time) =>
			moment(time).calendar(null, {
				sameDay: format,
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
};
