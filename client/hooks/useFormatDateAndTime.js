import { useCallback } from 'react';

import { getDateWithFormat, getDate } from '../../lib/rocketchat-dates';
import { useUserPreference } from '../contexts/UserContext';
import { useSetting } from '../contexts/SettingsContext';

export const useFormatDateAndTime = () => {
	const clockMode = useUserPreference('clockMode', false);
	const format = useSetting('Message_TimeAndDateFormat');

	return useCallback((time) => {
		switch (clockMode) {
			case 1:
				return getDateWithFormat(getDate(time), 'MMMM D, Y h:mm A');
			case 2:
				return getDateWithFormat(getDate(time), 'MMMM D, Y H:mm');
			default:
				return getDateWithFormat(getDate(time), format);
		}
	}, [clockMode, format]);
};
