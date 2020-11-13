import { useCallback } from 'react';

import { getDateWithFormat, getDate } from '../../lib/rocketchat-dates';
import { useUserPreference } from '../contexts/UserContext';
import { useSetting } from '../contexts/SettingsContext';

const dayFormat = ['h:mm A', 'H:mm'];

export const useFormatTime = () => {
	const clockMode = useUserPreference('clockMode', false);
	const format = useSetting('Message_TimeFormat');
	const sameDay = dayFormat[clockMode - 1] || format;
	return useCallback((time) => {
		switch (clockMode) {
			case 1:
			case 2:
				return getDateWithFormat(getDate(time), sameDay);
			default:
				return getDateWithFormat(getDate(time), format);
		}
	}, [clockMode, format, sameDay]);
};
