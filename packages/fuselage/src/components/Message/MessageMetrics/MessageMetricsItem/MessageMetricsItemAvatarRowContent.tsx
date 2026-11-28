import type { HTMLAttributes } from 'react';

import { prependClassName } from '../../../../helpers/prependClassName';

export type MessageMetricsItemAvatarRowContentProps = HTMLAttributes<HTMLDivElement>;

const MessageMetricsItemAvatarRowContent = ({ className, ...props }: MessageMetricsItemAvatarRowContentProps) => (
	<div className={prependClassName(className, 'rcx-message-metrics__avatar-row__content')} {...props} />
);

export default MessageMetricsItemAvatarRowContent;
