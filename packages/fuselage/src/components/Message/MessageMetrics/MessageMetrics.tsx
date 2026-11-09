import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageMetricsProps = HTMLAttributes<HTMLDivElement>;

const MessageMetrics = ({ className, ...props }: MessageMetricsProps) => (
	<div {...props} className={cx('rcx-message-metrics__content-wrapper', className)} />
);

export default MessageMetrics;
