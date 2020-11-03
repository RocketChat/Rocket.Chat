import { useCallback } from 'react';

import { getDate, getDateWithFormat } from '../../lib/rocketchat-dates';
import { useSetting } from '../contexts/SettingsContext';

export const useFormatDate = () => {
	const format = useSetting('Message_DateFormat');
	return useCallback((time) => getDateWithFormat(getDate(time), format), [format]);
};
