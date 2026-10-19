import type { HTMLAttributes } from 'react';

export type MessageMetricsContentItemProps = HTMLAttributes<HTMLDivElement>;

const MessageMetricsContentItem = (props: MessageMetricsContentItemProps) => (
	<div className='rcx-message-metrics__content-item' {...props} />
);

export default MessageMetricsContentItem;
