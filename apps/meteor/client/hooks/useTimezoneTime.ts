import { useState, useEffect } from 'react';

import { useFormatTime } from './useFormatTime';

export const useTimezoneTime = (offset: number, interval = 1000): string => {
	const [now, setNow] = useState(() => new Date());
	const format = useFormatTime();

	useEffect(() => {
		if (offset === undefined) {
			return;
		}

		const timer = setInterval(() => setNow(new Date()), interval);
		return () => clearInterval(timer);
	}, [offset, interval]);

	const shifted = new Date(now.getTime() + offset * 3600000 + now.getTimezoneOffset() * 60000);
	return format(shifted);
};
