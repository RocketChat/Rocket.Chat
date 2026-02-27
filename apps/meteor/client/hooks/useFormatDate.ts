import { useSetting } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

import { formatDate } from '../lib/utils/dateFormat';

export const useFormatDate = () => {
	const format = useSetting('Message_DateFormat');
	return useCallback((time: string | Date | number) => formatDate(time, String(format)), [format]);
};
