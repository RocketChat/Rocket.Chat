import { useCallback } from 'react';
import moment from 'moment';

import { useUserPreference } from '../contexts/UserContext';
import { useSetting } from '../contexts/SettingsContext';

export const useTimeAgo = () => {
	const clockMode = useUserPreference('clockMode', false);
	const dateFormat = useSetting('Message_DateFormat');
	const timeFormat = useSetting('Message_TimeFormat');

	return useCallback((time) => {
		switch (clockMode) {
			case 1:
				return moment(time).calendar(null, { sameDay: 'h:mm A', lastWeek: 'dddd h:mm A', sameElse: dateFormat }, []);
			case 2:
				return moment(time).calendar(null, { sameDay: 'HH:mm', lastWeek: 'dddd HH:mm', sameElse: dateFormat }, []);
			default:
				return moment(time).calendar(null, { sameDay: timeFormat, lastWeek: `dddd ${timeFormat}`, sameElse: dateFormat }, []);
		}
	}, [clockMode, dateFormat, timeFormat]);
};
