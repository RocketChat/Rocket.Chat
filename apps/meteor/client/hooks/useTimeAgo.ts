import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import type { MomentInput } from 'moment';
import moment from 'moment';
import { useCallback } from 'react';

import { t } from '../../app/utils/lib/i18n';

const dayFormat = ['h:mm A', 'H:mm'] as const;

export const useTimeAgo = () => {
	const clockMode = useUserPreference<1 | 2>('clockMode');
	const timeFormat = useSetting('Message_TimeFormat', 'LT');
	const format = clockMode !== undefined ? dayFormat[clockMode - 1] : timeFormat;
	return useCallback(
		(time: MomentInput) => {
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

export const useShortTimeAgo = () => {
	const clockMode = useUserPreference<1 | 2>('clockMode');
	const timeFormat = useSetting('Message_TimeFormat', 'LT');
	const format = clockMode !== undefined ? dayFormat[clockMode - 1] : timeFormat;
	return useCallback(
		(time: MomentInput) =>
			moment(time).calendar(null, {
				sameDay: format,
				lastDay: `[${t('Yesterday')}]`,
				lastWeek: 'dddd',
				sameElse(this: moment.Moment, now) {
					/*
					Using only this.isBefore():

					ERRORS:
						Cannot invoke an object which is possibly 'undefined'.
						This expression is not callable.
						Not all constituents of type 'CalendarSpecVal' are callable.
						Type 'string' has no call signatures.
					*/
					if (this.isBefore(now, 'year')) {
						return 'LL';
					}
					return 'MMM Do';
				},
			}),
		[format],
	);
};
