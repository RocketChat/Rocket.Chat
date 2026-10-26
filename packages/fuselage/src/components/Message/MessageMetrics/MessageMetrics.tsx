import type { HTMLAttributes } from 'react';

import MessageMetricsContentItem from './MessageMetricsContentItem';
import { cx } from '../../../helpers/composeClassNames';

export type MessageMetricsProps = HTMLAttributes<HTMLDivElement>;

const MessageMetrics = ({ className, ...props }: MessageMetricsProps) => (
	<MessageMetricsContentItem>
		<div {...props} className={cx('rcx-message-metrics__content-wrapper', className)} />
	</MessageMetricsContentItem>
);

export default MessageMetrics;
