import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageMetricsContentItemProps = HTMLAttributes<HTMLDivElement>;

const MessageMetricsContentItem = ({ className, ...props }: MessageMetricsContentItemProps) => (
	<div {...props} className={cx('rcx-message-metrics__content-item', className)} />
);

export default MessageMetricsContentItem;
