import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { formatDate } from '../lib/dateFormat';

type UseFormatDateAndTimeParams = {
	withSeconds?: boolean;
};

export const useFormatDateAndTime = ({ withSeconds }: UseFormatDateAndTimeParams = {}) => {
	const clockMode = useUserPreference('clockMode');
	const userTimezone = useUserPreference<string>('timezone');
	const timezone = userTimezone === 'local' ? undefined : userTimezone;
	const format = useSetting('Message_TimeAndDateFormat', 'LLL');

	return useCallback(
		(time: string | Date | number = new Date()) => {
			switch (clockMode) {
				case 1:
					return formatDate(time, withSeconds ? 'MMMM D, YYYY h:mm:ss A' : 'MMMM D, YYYY h:mm A', undefined, timezone);
				case 2:
					return formatDate(time, withSeconds ? 'MMMM D, YYYY H:mm:ss' : 'MMMM D, YYYY H:mm', undefined, timezone);

				default:
					return formatDate(time, withSeconds ? 'L LTS' : format, undefined, timezone);
			}
		},
		[clockMode, format, withSeconds, timezone],
	);
};
