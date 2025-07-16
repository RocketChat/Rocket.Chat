import { useUserPreference, useSetting } from '@rocket.chat/ui-contexts';
import type { MomentInput } from 'moment';
import moment from 'moment';
import { useCallback } from 'react';

const dayFormat = ['h:mm A', 'H:mm'] as const;

export const useFormatTime = () => {
	const clockMode = useUserPreference<1 | 2>('clockMode');
	const format = useSetting('Message_TimeFormat', 'LT');
	const sameDay = clockMode !== undefined ? dayFormat[clockMode - 1] : format;

	return useCallback(
		(time: MomentInput) => {
			switch (clockMode) {
				case 1:
				case 2:
					return moment(time).format(sameDay);

				default:
					return moment(time).format(format);
			}
		},
		[clockMode, format, sameDay],
	);
};
