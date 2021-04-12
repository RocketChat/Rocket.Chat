import moment from 'moment';
import { useCallback } from 'react';

import { useSetting } from '../contexts/SettingsContext';

export const useFormatDate = () => {
	const format = useSetting('Message_DateFormat');
	return useCallback((time) => moment(time).format(format), [format]);
};
