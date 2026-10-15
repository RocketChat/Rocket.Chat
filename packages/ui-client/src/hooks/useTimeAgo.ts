import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { formatTimeAgo } from '../lib/dateFormat';

const dayFormat = ['h:mm A', 'H:mm'] as const;

type TimeAgoOptions = {
	/** The moment.js format for dates beyond the last week. */
	dateFormat?: string;
	/** The moment.js format for the weekday of dates within the last week, shown before the time. */
	weekdayFormat?: string;
};

export const useTimeAgo = ({ dateFormat = 'LL', weekdayFormat = 'dddd' }: TimeAgoOptions = {}) => {
	const { t } = useTranslation();
	const clockMode = useUserPreference<1 | 2>('clockMode');
	const timeFormat = useSetting('Message_TimeFormat', 'LT');
	const format = clockMode !== undefined ? dayFormat[clockMode - 1] : timeFormat;

	return useCallback(
		(time: string | Date | number) => {
			return formatTimeAgo(time, {
				sameDayFormat: format,
				yesterdayLabel: t('Yesterday_at'),
				lastDayFormat: format,
				lastWeekFormat: `${weekdayFormat} ${format}`,
				otherFormat: dateFormat,
				otherYearFormat: dateFormat,
			});
		},
		[dateFormat, format, t, weekdayFormat],
	);
};

export const useShortTimeAgo = () => {
	const { t } = useTranslation();
	const clockMode = useUserPreference<1 | 2>('clockMode');
	const timeFormat = useSetting('Message_TimeFormat', 'LT');
	const format = clockMode !== undefined ? dayFormat[clockMode - 1] : timeFormat;

	return useCallback(
		(time: string | Date | number) =>
			formatTimeAgo(time, {
				sameDayFormat: format,
				yesterdayLabel: t('Yesterday'),
				lastWeekFormat: 'dddd',
				otherFormat: 'MMM Do',
				otherYearFormat: 'LL',
			}),
		[format, t],
	);
};
