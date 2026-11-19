import type { HTMLAttributes } from 'react';

import { prependClassName } from '../../../../helpers/prependClassName';

export type MessageMetricsItemProps = HTMLAttributes<HTMLDivElement>;

/**
 * A row of small avatars in a metrics entry, for the thread's participants.
 */
const MessageMetricsItemAvatarRow = ({ className, ...props }: MessageMetricsItemProps) => (
	<div className={prependClassName(className, 'rcx-message-metrics__avatar-row')} {...props} />
);

export default MessageMetricsItemAvatarRow;
