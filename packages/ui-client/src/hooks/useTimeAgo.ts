import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { formatTimeAgo } from '../lib/dateFormat';

const dayFormat = ['h:mm A', 'H:mm'] as const;

export const useTimeAgo = () => {
	const { t } = useTranslation();
	const clockMode = useUserPreference<1 | 2>('clockMode');
	const userTimezone = useUserPreference<string>('timezone');
	const timezone = userTimezone === 'local' ? undefined : userTimezone;
	const timeFormat = useSetting('Message_TimeFormat', 'LT');
	const format = clockMode !== undefined ? dayFormat[clockMode - 1] : timeFormat;

	return useCallback(
		(time: string | Date | number) => {
			return formatTimeAgo(
				time,
				{
					sameDayFormat: format,
					yesterdayLabel: t('Yesterday_at'),
					lastDayFormat: format,
					lastWeekFormat: `dddd ${format}`,
					otherFormat: 'LL',
					otherYearFormat: 'LL',
				},
				undefined,
				timezone,
			);
		},
		[format, t, timezone],
	);
};

export const useShortTimeAgo = () => {
	const { t } = useTranslation();
	const clockMode = useUserPreference<1 | 2>('clockMode');
	const userTimezone = useUserPreference<string>('timezone');
	const timezone = userTimezone === 'local' ? undefined : userTimezone;
	const timeFormat = useSetting('Message_TimeFormat', 'LT');
	const format = clockMode !== undefined ? dayFormat[clockMode - 1] : timeFormat;

	return useCallback(
		(time: string | Date | number) =>
			formatTimeAgo(
				time,
				{
					sameDayFormat: format,
					yesterdayLabel: t('Yesterday'),
					lastWeekFormat: 'dddd',
					otherFormat: 'MMM Do',
					otherYearFormat: 'LL',
				},
				undefined,
				timezone,
			),
		[format, t, timezone],
	);
};
