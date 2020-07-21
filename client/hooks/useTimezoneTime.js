import { useState, useEffect } from 'react';
import moment from 'moment';

import { useFormatTime } from './useFormatTime';

export const useTimezoneTime = (offset, interval = 1000) => {
	const [time, setTime] = useState(null);
	const format = useFormatTime();
	useEffect(() => {
		if (offset === undefined) {
			return;
		}
		const update = () => setTime(moment().utcOffset(offset));
		const timer = setInterval(update, interval);
		update();
		return () => clearInterval(timer);
	}, [offset, interval]);

	return format(time);
};
