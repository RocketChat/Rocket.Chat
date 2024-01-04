import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import { useCallback } from 'react';

import { t } from '../../app/utils/lib/i18n';

const dayFormat = ['h:mm A', 'H:mm'] as const;

export const useTimeAgo = (): ((time: Date | number | string) => string) => {
	const clockMode = useUserPreference<1 | 2>('clockMode');
	const timeFormat = useSetting<string>('Message_TimeFormat', 'LT');
	const format = clockMode !== undefined ? dayFormat[clockMode - 1] : timeFormat;
	return useCallback(
		(time) => {
			return moment(time).calendar(null, {
				sameDay: format,
				lastDay: moment(time).calendar('lastDay').replace('LT', format),
				lastWeek: `dddd ${format}`,
				sameElse: 'LL',
			});
		},
		[format],
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
				lastDay: `[${t('Yesterday')}]`,
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
		[format],
	);
};
