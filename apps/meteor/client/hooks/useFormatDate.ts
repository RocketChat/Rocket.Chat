import { useSetting } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import { useCallback } from 'react';

export const useFormatDate = () => {
	const format = useSetting('Message_DateFormat');
	return useCallback((time: string | Date | number) => moment(time).format(String(format)), [format]);
};
