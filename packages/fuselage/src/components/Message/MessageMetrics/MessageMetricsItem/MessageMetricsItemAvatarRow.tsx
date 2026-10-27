import type { HTMLAttributes } from 'react';

import { prependClassName } from '../../../../helpers/prependClassName';

export type MessageMetricsItemProps = HTMLAttributes<HTMLDivElement>;

const MessageMetricsItemAvatarRow = ({ className, ...props }: MessageMetricsItemProps) => (
	<div className={prependClassName(className, 'rcx-message-metrics__avatar-row')} {...props} />
);

export default MessageMetricsItemAvatarRow;
