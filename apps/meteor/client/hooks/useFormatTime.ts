import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { formatDate } from '../lib/utils/dateFormat';

const dayFormat = ['h:mm A', 'H:mm'] as const;

export const useFormatTime = () => {
	const clockMode = useUserPreference<1 | 2>('clockMode');
	const format = useSetting('Message_TimeFormat', 'LT');
	const sameDay = clockMode !== undefined ? dayFormat[clockMode - 1] : format;

	return useCallback(
		(time: string | Date | number) => {
			switch (clockMode) {
				case 1:
				case 2:
					return formatDate(time, sameDay);

				default:
					return formatDate(time, format);
			}
		},
		[clockMode, format, sameDay],
	);
};
