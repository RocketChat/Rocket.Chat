import type { HTMLAttributes } from 'react';

export type MessageMetricsItemLabelProps = HTMLAttributes<HTMLDivElement>;

const MessageMetricsItemLabel = (props: MessageMetricsItemLabelProps) => <div className='rcx-message-metrics__item-label' {...props} />;

export default MessageMetricsItemLabel;
