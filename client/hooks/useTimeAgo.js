import { useCallback, useMemo } from 'react';
import moment from 'moment';

import { useUserPreference } from '../contexts/UserContext';
import { useSetting } from '../contexts/SettingsContext';

export const useTimeAgo = () => {
	const clockMode = useUserPreference('clockMode', false);
	const format = useSetting('Message_TimeAndDateFormat');

	const sameElse = useMemo(() => {
		switch (clockMode) {
			case 1:
				return 'MMMM D, Y h:mm A';
			case 2:
				return 'MMMM D, Y H:mm';
			default:
				return format;
		}
	}, [clockMode, format]);

	return useCallback((time) => moment(time).calendar(null, { sameDay: 'LT', lastWeek: 'dddd LT', sameElse }), [sameElse]);
};
