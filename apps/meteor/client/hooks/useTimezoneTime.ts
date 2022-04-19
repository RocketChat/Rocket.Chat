import moment from 'moment';
import { useState, useEffect } from 'react';

import { useFormatTime } from './useFormatTime';

export const useTimezoneTime = (offset: number, interval = 1000): string => {
	const [time, setTime] = useState<moment.Moment>(() => moment().utcOffset(offset));

	const format = useFormatTime();

	useEffect(() => {
		if (offset === undefined) {
			return;
		}

		const update = (): void => {
			setTime(moment().utcOffset(offset));
		};

		const timer = setInterval(update, interval);
		update();

		return (): void => {
			clearInterval(timer);
		};
	}, [offset, interval]);

	return format(time);
};
