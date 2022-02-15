import moment from 'moment';
import { useCallback } from 'react';

import { useUserPreference } from '../contexts/UserContext';

const dayFormat = ['h:mm:ss A', 'H:mm:ss'] as const;
const format = 'L LTS';

export const useFormatTimeWithSeconds = (): ((input: moment.MomentInput) => string) => {
	const clockMode = useUserPreference<1 | 2>('clockMode');
	const sameDay = clockMode !== undefined ? dayFormat[clockMode - 1] : format;

	return useCallback(
		(time) => {
			switch (clockMode) {
				case 1:
				case 2:
					return moment(time).format(sameDay);

				default:
					return moment(time).format(format);
			}
		},
		[clockMode, sameDay],
	);
};
