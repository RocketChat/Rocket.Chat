import type { HTMLAttributes } from 'react';

import { prependClassName } from '../../../../helpers/prependClassName';

export type MessageMetricsItemProps = HTMLAttributes<HTMLDivElement>;

/**
 * One entry of a metrics row, such as the reply count: an icon or avatars, and a label.
 */
const MessageMetricsItem = ({ className, ...props }: MessageMetricsItemProps) => (
	<div className={prependClassName(className, 'rcx-message-metrics__item')} {...props} />
);

export default MessageMetricsItem;
