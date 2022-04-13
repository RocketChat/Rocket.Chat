import { useSetting } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import { useCallback } from 'react';

export const useFormatDate = (): ((time: string | Date | number) => string) => {
	const format = useSetting('Message_DateFormat');
	return useCallback((time) => moment(time).format(String(format)), [format]);
};
