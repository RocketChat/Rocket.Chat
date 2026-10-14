import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { formatDate } from '../lib/dateFormat';

const dayFormat = ['h:mm A', 'H:mm'] as const;

export const useFormatTime = (timezoneOverride?: string) => {
	const clockMode = useUserPreference<1 | 2>('clockMode');
	const userTimezone = useUserPreference<string>('timezone');
	const timezone = timezoneOverride ?? (userTimezone === 'local' ? undefined : userTimezone);
	const format = useSetting('Message_TimeFormat', 'LT');
	const sameDay = clockMode !== undefined ? dayFormat[clockMode - 1] : format;

	return useCallback(
		(time: string | Date | number, tz?: string) => {
			const effectiveTz = tz ?? timezone;
			switch (clockMode) {
				case 1:
				case 2:
					return formatDate(time, sameDay, undefined, effectiveTz);

				default:
					return formatDate(time, format, undefined, effectiveTz);
			}
		},
		[clockMode, format, sameDay, timezone],
	);
};
