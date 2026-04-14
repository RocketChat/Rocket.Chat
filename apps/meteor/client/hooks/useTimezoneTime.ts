import { guessTimezoneFromOffset } from '@rocket.chat/tools';
import { useState, useEffect } from 'react';

export const useTimezoneTime = (offset: number, interval = 1000): string => {
	const [now, setNow] = useState(() => new Date());

	useEffect(() => {
		if (offset === undefined) {
			return;
		}

		const timer = setInterval(() => setNow(new Date()), interval);
		return () => clearInterval(timer);
	}, [offset, interval]);

	const zone = guessTimezoneFromOffset(offset);
	return new Intl.DateTimeFormat(undefined, {
		timeZone: zone,
		timeStyle: 'short',
	}).format(now);
};
