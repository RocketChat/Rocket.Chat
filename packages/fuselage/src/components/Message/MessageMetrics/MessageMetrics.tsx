import type { HTMLAttributes } from 'react';

import { cx } from '../../../helpers/composeClassNames';

export type MessageMetricsProps = HTMLAttributes<HTMLDivElement>;

/**
 * The summary of a message's thread or discussion, under the message: a button that opens it, counts, participants,
 * the last activity and whether the user follows it. Place it in a `MessageBlock`.
 */
const MessageMetrics = ({ className, ...props }: MessageMetricsProps) => (
	<div {...props} className={cx('rcx-message-metrics__content-wrapper', className)} />
);

export default MessageMetrics;
