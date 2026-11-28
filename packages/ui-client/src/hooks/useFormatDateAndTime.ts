import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { formatDate } from '../lib/dateFormat';

type UseFormatDateAndTimeParams = {
	withSeconds?: boolean;
};

export const useFormatDateAndTime = ({ withSeconds }: UseFormatDateAndTimeParams = {}) => {
	const clockMode = useUserPreference('clockMode');
	const format = useSetting('Message_TimeAndDateFormat', 'LLL');

	return useCallback(
		(time: string | Date | number = new Date()) => {
			switch (clockMode) {
				case 1:
					return formatDate(time, withSeconds ? 'LL h:mm:ss A' : 'LL h:mm A');
				case 2:
					return formatDate(time, withSeconds ? 'LL H:mm:ss' : 'LL H:mm');

				default:
					return formatDate(time, withSeconds ? 'L LTS' : format);
			}
		},
		[clockMode, format, withSeconds],
	);
};
