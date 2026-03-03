import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { t } from '../../app/utils/lib/i18n';
import { formatTimeAgo } from '../lib/utils/dateFormat';

const dayFormat = ['h:mm A', 'H:mm'] as const;

export const useTimeAgo = () => {
	const clockMode = useUserPreference<1 | 2>('clockMode');
	const timeFormat = useSetting('Message_TimeFormat', 'LT');
	const format = clockMode !== undefined ? dayFormat[clockMode - 1] : timeFormat;

	return useCallback(
		(time: string | Date | number) => {
			return formatTimeAgo(time, {
				sameDayFormat: format,
				yesterdayLabel: `${t('Yesterday')} at `,
				lastDayFormat: format,
				lastWeekFormat: `dddd ${format}`,
				otherFormat: 'LL',
				otherYearFormat: 'LL',
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
		(time: string | Date | number) =>
			formatTimeAgo(time, {
				sameDayFormat: format,
				yesterdayLabel: `[${t('Yesterday')}]`,
				lastWeekFormat: 'dddd',
				otherFormat: 'MMM Do',
				otherYearFormat: 'LL',
			}),
		[format],
	);
};
