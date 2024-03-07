/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { Tag } from '@rocket.chat/fuselage';
import type * as MessageParser from '@rocket.chat/message-parser';
import { format } from 'date-fns';
import { useContext, useEffect, useState, type ReactElement } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { MarkupInteractionContext } from '../../MarkupInteractionContext';
import { timeAgo } from './timeago';

type BoldSpanProps = {
	children: MessageParser.Timestamp;
};

// | `f`    | Full date and time        | Thursday, December 31, 2020 12:00 AM    |
// | `F`    | Full date and time (long) | Thursday, December 31, 2020 12:00:00 AM |
// | `R`    | Relative time             | 1 year ago                              |

const Timestamp = ({ children }: BoldSpanProps): ReactElement => {
	const { enableTimestamp } = useContext(MarkupInteractionContext);

	if (!enableTimestamp) {
		return <>{`<t:${children.value.timestamp}:${children.value.format}>`}</>;
	}

	switch (children.value.format) {
		case 't': // Short time format
			return <ShortTime value={parseInt(children.value.timestamp)} />;
		case 'T': // Long time format
			return <LongTime value={parseInt(children.value.timestamp)} />;
		case 'd': // Short date format
			return <ShortDate value={parseInt(children.value.timestamp)} />;
		case 'D': // Long date format
			return <LongDate value={parseInt(children.value.timestamp)} />;
		case 'f': // Full date and time format
			return <FullDate value={parseInt(children.value.timestamp)} />;

		case 'F': // Full date and time (long) format
			return <FullDateLong value={parseInt(children.value.timestamp)} />;

		case 'R': // Relative time format
			return (
				<ErrorBoundary fallback={<>{new Date().toUTCString()}</>}>
					<RelativeTime key={children.value.timestamp} value={parseInt(children.value.timestamp)} />
				</ErrorBoundary>
			);

		default:
			return <time dateTime={children.value.timestamp}> {JSON.stringify(children.value.timestamp)}</time>;
	}
};

// eslint-disable-next-line react/no-multi-comp
const ShortTime = ({ value }: { value: number }) => (
	<Time value={format(new Date(value), 'p')} dateTime={new Date(value).toISOString()} />
);

// eslint-disable-next-line react/no-multi-comp
const LongTime = ({ value }: { value: number }) => (
	<Time value={format(new Date(value), 'pp')} dateTime={new Date(value).toISOString()} />
);

// eslint-disable-next-line react/no-multi-comp
const ShortDate = ({ value }: { value: number }) => (
	<Time value={format(new Date(value), 'P')} dateTime={new Date(value).toISOString()} />
);
// eslint-disable-next-line react/no-multi-comp
const LongDate = ({ value }: { value: number }) => (
	<Time value={format(new Date(value), 'Pp')} dateTime={new Date(value).toISOString()} />
);

// eslint-disable-next-line react/no-multi-comp
const FullDate = ({ value }: { value: number }) => (
	<Time value={format(new Date(value), 'PPPppp')} dateTime={new Date(value).toISOString()} />
);

// eslint-disable-next-line react/no-multi-comp
const FullDateLong = ({ value }: { value: number }) => (
	<Time value={format(new Date(value), 'PPPPpppp')} dateTime={new Date(value).toISOString()} />
);

// eslint-disable-next-line react/no-multi-comp
const Time = ({ value, dateTime }: { value: string; dateTime: string }) => (
	<time
		title={new Date(dateTime).toLocaleString()}
		dateTime={dateTime}
		style={{
			display: 'inline-block',
		}}
	>
		<Tag> {value}</Tag>
	</time>
);

// eslint-disable-next-line react/no-multi-comp
const RelativeTime = ({ value }: { value: number }) => {
	const { language } = useContext(MarkupInteractionContext);
	const [time, setTime] = useState(() => timeAgo(value, language ?? 'en'));
	const [timeToRefresh, setTimeToRefresh] = useState(() => getTimeToRefresh(value));

	useEffect(() => {
		const interval = setInterval(() => {
			setTime(timeAgo(value, 'en'));
			setTimeToRefresh(getTimeToRefresh(value));
		}, timeToRefresh);

		return () => clearInterval(interval);
	}, [value, timeToRefresh]);

	return <Time value={time} dateTime={new Date(value).toISOString()} />;
};

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

export default Timestamp;
