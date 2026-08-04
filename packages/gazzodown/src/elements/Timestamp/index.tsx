import { Tag } from '@rocket.chat/fuselage';
import type * as MessageParser from '@rocket.chat/message-parser';
import { format, intlFormatDistance } from 'date-fns';
import { useContext, useEffect, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { MarkupInteractionContext } from '../../MarkupInteractionContext';

type BoldSpanProps = {
	children: MessageParser.Timestamp;
};

export type TimestampProps = { format: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R'; value: Date };

const Timestamp = ({ format, value }: TimestampProps) => {
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
const TimestampWrapper = ({ children }: BoldSpanProps) => (
	<ErrorBoundary fallback={<>{new Date(parseInt(children.value.timestamp) * 1000).toUTCString()}</>}>
		<Timestamp format={children.value.format} value={new Date(parseInt(children.value.timestamp) * 1000)} />
	</ErrorBoundary>
);

export type ShortTimeProps = { value: Date };

// eslint-disable-next-line react/no-multi-comp
const ShortTime = ({ value }: ShortTimeProps) => <Time value={format(value, 'p')} dateTime={value.toISOString()} />;

export type LongTimeProps = { value: Date };

// eslint-disable-next-line react/no-multi-comp
const LongTime = ({ value }: LongTimeProps) => <Time value={format(value, 'pp')} dateTime={value.toISOString()} />;

export type ShortDateProps = { value: Date };

// eslint-disable-next-line react/no-multi-comp
const ShortDate = ({ value }: ShortDateProps) => <Time value={format(value, 'P')} dateTime={value.toISOString()} />;

export type LongDateProps = { value: Date };

// eslint-disable-next-line react/no-multi-comp
const LongDate = ({ value }: LongDateProps) => <Time value={format(value, 'Pp')} dateTime={value.toISOString()} />;

export type FullDateProps = { value: Date };

// eslint-disable-next-line react/no-multi-comp
const FullDate = ({ value }: FullDateProps) => <Time value={format(value, 'PPPP p')} dateTime={value.toISOString()} />;

export type FullDateLongProps = { value: Date };

// eslint-disable-next-line react/no-multi-comp
const FullDateLong = ({ value }: FullDateLongProps) => <Time value={format(value, 'PPPP pp')} dateTime={value.toISOString()} />;

export type TimeProps = { value: string; dateTime: string };

// eslint-disable-next-line react/no-multi-comp
const Time = ({ value, dateTime }: TimeProps) => (
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

export type RelativeTimeProps = { value: Date };

// eslint-disable-next-line react/no-multi-comp
const RelativeTime = ({ value }: RelativeTimeProps) => {
	const time = value.getTime();

	const { language } = useContext(MarkupInteractionContext);
	const locale = language ?? 'en';
	const [text, setText] = useState(() => intlFormatDistance(time, Date.now(), { locale }));

	useEffect(() => {
		setText(intlFormatDistance(time, Date.now(), { locale }));

		let timeoutId: ReturnType<typeof setTimeout>;

		const refresh = () => {
			setText(intlFormatDistance(time, Date.now(), { locale }));
			timeoutId = setTimeout(refresh, getTimeToRefresh(time));
		};

		timeoutId = setTimeout(refresh, getTimeToRefresh(time));

		return () => clearTimeout(timeoutId);
	}, [time, locale]);

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
