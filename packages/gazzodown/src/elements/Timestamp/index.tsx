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

const Timestamp = ({ format, value }: { format: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R'; value: Date }): ReactElement => {
	switch (format) {
		case 't': // Short time format
			return <ShortTime value={value} />;
		case 'T': // Long time format
			return <LongTime value={value} />;
		case 'd': // Short date format
			return <ShortDate value={value} />;
		case 'D': // Long date format
			return <LongDate value={value} />;
		case 'f': // Full date and time format
			return <FullDate value={value} />;

		case 'F': // Full date and time (long) format
			return <FullDateLong value={value} />;

		case 'R': // Relative time format
			return <RelativeTime value={value} />;

		default:
			return <time dateTime={value.toISOString()}> {JSON.stringify(value.getTime())}</time>;
	}
};

// eslint-disable-next-line react/no-multi-comp
const TimestampWrapper = ({ children }: BoldSpanProps): ReactElement => {
	const { enableTimestamp } = useContext(MarkupInteractionContext);

	if (!enableTimestamp) {
		return <>{`<t:${children.value.timestamp}:${children.value.format}>`}</>;
	}

	return (
		<ErrorBoundary fallback={<>{new Date(parseInt(children.value.timestamp) * 1000).toUTCString()}</>}>
			<Timestamp format={children.value.format} value={new Date(parseInt(children.value.timestamp) * 1000)} />
		</ErrorBoundary>
	);
};

// eslint-disable-next-line react/no-multi-comp
const ShortTime = ({ value }: { value: Date }) => <Time value={format(value, 'p')} dateTime={value.toISOString()} />;

// eslint-disable-next-line react/no-multi-comp
const LongTime = ({ value }: { value: Date }) => <Time value={format(value, 'pp')} dateTime={value.toISOString()} />;

// eslint-disable-next-line react/no-multi-comp
const ShortDate = ({ value }: { value: Date }) => <Time value={format(value, 'P')} dateTime={value.toISOString()} />;

// eslint-disable-next-line react/no-multi-comp
const LongDate = ({ value }: { value: Date }) => <Time value={format(value, 'Pp')} dateTime={value.toISOString()} />;

// eslint-disable-next-line react/no-multi-comp
const FullDate = ({ value }: { value: Date }) => <Time value={format(value, 'PPPppp')} dateTime={value.toISOString()} />;

// eslint-disable-next-line react/no-multi-comp
const FullDateLong = ({ value }: { value: Date }) => <Time value={format(value, 'PPPPpppp')} dateTime={value.toISOString()} />;

// eslint-disable-next-line react/no-multi-comp
const Time = ({ value, dateTime }: { value: string; dateTime: string }) => (
	<time
		title={new Date(dateTime).toLocaleString()}
		dateTime={dateTime}
		style={{
			display: 'inline-block',
		}}
	>
		<Tag>{value}</Tag>
	</time>
);

// eslint-disable-next-line react/no-multi-comp
const RelativeTime = ({ value }: { value: Date }) => {
	const time = value.getTime();

	const { language } = useContext(MarkupInteractionContext);
	const [text, setTime] = useState(() => timeAgo(time, language ?? 'en'));
	const [timeToRefresh, setTimeToRefresh] = useState(() => getTimeToRefresh(time));

	useEffect(() => {
		const interval = setInterval(() => {
			setTime(timeAgo(value.getTime(), 'en'));
			setTimeToRefresh(getTimeToRefresh(time));
		}, timeToRefresh);

		return () => clearInterval(interval);
	}, [time, timeToRefresh, value]);

	return <Time value={text} dateTime={value.toISOString()} />;
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

export default TimestampWrapper;
