import type * as MessageParser from '@rocket.chat/message-parser';
import { ErrorBoundary } from 'react-error-boundary';

import Timestamp from './Timestamp';

type TimestampWrapperProps = {
	children: MessageParser.Timestamp;
};

const TimestampWrapper = ({ children }: TimestampWrapperProps) => (
	<ErrorBoundary fallback={<>{new Date(parseInt(children.value.timestamp) * 1000).toUTCString()}</>}>
		<Timestamp format={children.value.format} value={new Date(parseInt(children.value.timestamp) * 1000)} />
	</ErrorBoundary>
);

export default TimestampWrapper;
