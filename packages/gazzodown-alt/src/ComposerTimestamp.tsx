import type * as MessageParser from '@rocket.chat/message-parser';
import type { ReactElement } from 'react';

type ComposerTimestampProps = {
	children: MessageParser.Timestamp;
};

const timestampStyle = {
	backgroundColor: 'var(--rcx-color-surface-tint, rgba(0, 0, 0, 0.05))',
	borderRadius: '3px',
	padding: '0 4px',
	display: 'inline-block',
} as const;

const ComposerTimestamp = ({ children }: ComposerTimestampProps): ReactElement => {
	const date = new Date(parseInt(children.value.timestamp) * 1000);
	const formatted = date.toLocaleString();

	return (
		<time dateTime={date.toISOString()} style={timestampStyle}>
			{formatted}
		</time>
	);
};

export default ComposerTimestamp;
