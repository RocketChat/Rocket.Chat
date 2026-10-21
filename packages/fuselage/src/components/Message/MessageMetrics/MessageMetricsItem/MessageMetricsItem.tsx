import type { HTMLAttributes } from 'react';

import { prependClassName } from '../../../../helpers/prependClassName';

export type MessageMetricsItemProps = HTMLAttributes<HTMLDivElement>;

const MessageMetricsItem = ({ className, ...props }: MessageMetricsItemProps) => (
	<div className={prependClassName(className, 'rcx-message-metrics__item')} {...props} />
);

export default MessageMetricsItem;
