import type { HTMLAttributes } from 'react';

import { cx } from '../../../../helpers/composeClassNames';

export type MessageMetricsItemLabelProps = HTMLAttributes<HTMLDivElement>;

/**
 * The text of a metrics entry, such as a count or a date.
 */
const MessageMetricsItemLabel = ({ className, ...props }: MessageMetricsItemLabelProps) => (
	<div {...props} className={cx('rcx-message-metrics__item-label', className)} />
);

export default MessageMetricsItemLabel;
