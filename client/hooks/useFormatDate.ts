import moment from 'moment';
import { useCallback } from 'react';

import { useSetting } from '../contexts/SettingsContext';

export const useFormatDate = (): ((time: string | Date | number) => string) => {
	const format = useSetting('Message_DateFormat');
	return useCallback((time) => moment(time).format(String(format)), [format]);
};
