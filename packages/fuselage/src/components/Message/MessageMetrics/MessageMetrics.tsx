import type { HTMLAttributes } from 'react';

import MessageMetricsContentItem from './MessageMetricsContentItem';

export type MessageMetricsProps = HTMLAttributes<HTMLDivElement>;

const MessageMetrics = (props: MessageMetricsProps) => (
	<MessageMetricsContentItem>
		<div className='rcx-message-metrics__content-wrapper' {...props} />
	</MessageMetricsContentItem>
);

export default MessageMetrics;
