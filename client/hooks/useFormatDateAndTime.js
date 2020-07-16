import { useCallback } from 'react';
import moment from 'moment';

import { useUserPreference } from '../contexts/UserContext';
import { useSetting } from '../contexts/SettingsContext';

export const useFormatDateAndTime = () => {
	const clockMode = useUserPreference('clockMode', false);
	const format = useSetting('Message_TimeAndDateFormat');

	return useCallback((time) => {
		switch (clockMode) {
			case 1:
				return moment(time).format('MMMM D, Y h:mm A');
			case 2:
				return moment(time).format('MMMM D, Y H:mm');
			default:
				return moment(time).format(format);
		}
	}, [clockMode, format]);
};
