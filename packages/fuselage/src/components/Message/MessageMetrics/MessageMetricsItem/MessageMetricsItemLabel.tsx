import type { HTMLAttributes } from 'react';

import { cx } from '../../../../helpers/composeClassNames';

export type MessageMetricsItemLabelProps = HTMLAttributes<HTMLDivElement>;

const MessageMetricsItemLabel = ({ className, ...props }: MessageMetricsItemLabelProps) => (
	<div {...props} className={cx('rcx-message-metrics__item-label', className)} />
);

export default MessageMetricsItemLabel;
