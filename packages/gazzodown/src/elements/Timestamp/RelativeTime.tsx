import { intlFormatDistance } from 'date-fns';
import { useContext, useState, useEffect } from 'react';

import Time from './Time';
import { MarkupInteractionContext } from '../../MarkupInteractionContext';

const getTimeToRefresh = (time: number): number => {
	const timeToRefresh = time - Date.now();

	// less than 1 minute
	if (timeToRefresh < 60000) {
		return 1000;
	}

	// if the difference is in the minutes range, we should refresh the time in 1 minute / 2
	if (timeToRefresh < 3600000) {
		return 60000 / 2;
	}

	// if the difference is in the hours range, we should refresh the time in 5 minutes
	if (timeToRefresh < 86400000) {
		return 60000 * 5;
	}

	// refresh the time in 1 hour
	return 3600000;
};

export type RelativeTimeProps = {
	value: Date;
};

const RelativeTime = ({ value }: RelativeTimeProps) => {
	const time = value.getTime();

	const { language } = useContext(MarkupInteractionContext);
	const [text, setTime] = useState(() => intlFormatDistance(time, Date.now(), { locale: language ?? 'en' }));
	const [timeToRefresh, setTimeToRefresh] = useState(() => getTimeToRefresh(time));

	useEffect(() => {
		const interval = setInterval(() => {
			setTime(intlFormatDistance(value.getTime(), Date.now(), { locale: 'en' }));
			setTimeToRefresh(getTimeToRefresh(time));
		}, timeToRefresh);

		return () => clearInterval(interval);
	}, [time, timeToRefresh, value]);

	return <Time value={text} dateTime={value.toISOString()} />;
};

export default RelativeTime;
